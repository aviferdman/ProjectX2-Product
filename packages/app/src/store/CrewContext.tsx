/**
 * CrewStore — React context + useReducer for crew CRUD.
 * Persists to localStorage under 'crewspace:crews'.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { CrewDefinition, CreateCrewInput, UpdateCrewInput } from '../types/crew.js';
import type { AgentNode, TaskNode } from '../types/workflow.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'crewspace:crews';

const CREW_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pickColor(index: number): string {
  return CREW_COLORS[index % CREW_COLORS.length]!;
}

function loadCrews(): CrewDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CrewDefinition[]) : [];
  } catch {
    return [];
  }
}

function saveCrews(crews: CrewDefinition[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(crews));
}

/* ------------------------------------------------------------------ */
/* State & Actions                                                     */
/* ------------------------------------------------------------------ */

export interface CrewStoreState {
  readonly crews: CrewDefinition[];
}

export interface CrewStoreActions {
  createCrew(input: CreateCrewInput): CrewDefinition;
  updateCrew(crewId: string, input: UpdateCrewInput): void;
  deleteCrew(crewId: string): void;
  addAgentToCrew(
    crewId: string,
    agent: Omit<AgentNode, 'id' | 'status' | 'position'> & { id?: string },
  ): AgentNode;
  updateAgentInCrew(crewId: string, agentId: string, updates: Partial<Omit<AgentNode, 'id'>>): void;
  removeAgentFromCrew(crewId: string, agentId: string): void;
  addTaskToCrew(crewId: string, task: Omit<TaskNode, 'id' | 'status'>): TaskNode;
  updateTaskInCrew(crewId: string, taskId: string, updates: Partial<Omit<TaskNode, 'id'>>): void;
  removeTaskFromCrew(crewId: string, taskId: string): void;
  addWorkflowToCrew(crewId: string, workflowId: string): void;
  getCrewById(crewId: string): CrewDefinition | undefined;
  importCrewFromWorkflow(
    name: string,
    description: string,
    agents: AgentNode[],
    tasks: TaskNode[],
  ): CrewDefinition;
}

export type CrewContextValue = CrewStoreState & CrewStoreActions;

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

type CrewAction =
  | { type: 'SET_CREWS'; crews: CrewDefinition[] }
  | { type: 'ADD_CREW'; crew: CrewDefinition }
  | { type: 'UPDATE_CREW'; crewId: string; updates: Partial<CrewDefinition> }
  | { type: 'DELETE_CREW'; crewId: string }
  | { type: 'REPLACE_CREW'; crew: CrewDefinition };

function crewReducer(state: CrewStoreState, action: CrewAction): CrewStoreState {
  switch (action.type) {
    case 'SET_CREWS':
      return { ...state, crews: action.crews };
    case 'ADD_CREW':
      return { ...state, crews: [...state.crews, action.crew] };
    case 'UPDATE_CREW':
      return {
        ...state,
        crews: state.crews.map((c) =>
          c.id === action.crewId ? { ...c, ...action.updates, updatedAt: Date.now() } : c,
        ),
      };
    case 'DELETE_CREW':
      return { ...state, crews: state.crews.filter((c) => c.id !== action.crewId) };
    case 'REPLACE_CREW':
      return {
        ...state,
        crews: state.crews.map((c) => (c.id === action.crew.id ? action.crew : c)),
      };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

const CrewContext = createContext<CrewContextValue | null>(null);
CrewContext.displayName = 'CrewContext';

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useCrewStore(): CrewContextValue {
  const ctx = useContext(CrewContext);
  if (!ctx) {
    throw new Error('useCrewStore must be used within a <CrewProvider>');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export interface CrewProviderProps {
  initialCrews?: CrewDefinition[];
  children: React.ReactNode;
}

export function CrewProvider({ initialCrews, children }: CrewProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(crewReducer, {
    crews: initialCrews ?? loadCrews(),
  });

  // Persist on change
  useEffect(() => {
    saveCrews(state.crews);
  }, [state.crews]);

  const getCrewById = useCallback(
    (crewId: string): CrewDefinition | undefined => {
      return state.crews.find((c) => c.id === crewId);
    },
    [state.crews],
  );

  const createCrew = useCallback(
    (input: CreateCrewInput): CrewDefinition => {
      const now = Date.now();
      const builtWorkflows = (input.workflows ?? []).map((w, i) => ({
        id: generateId(`wf-${i}`),
        name: w.name,
        description: w.description,
        createdAt: now,
      }));
      const crew: CrewDefinition = {
        id: generateId('crew'),
        name: input.name,
        description: input.description,
        agents: input.agents ?? [],
        tasks: input.tasks ?? [],
        workflowIds: builtWorkflows.map((w) => w.id),
        workflows: builtWorkflows,
        color: input.color ?? pickColor(state.crews.length),
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_CREW', crew });
      return crew;
    },
    [state.crews.length],
  );

  const updateCrew = useCallback((crewId: string, input: UpdateCrewInput): void => {
    dispatch({ type: 'UPDATE_CREW', crewId, updates: input });
  }, []);

  const deleteCrew = useCallback((crewId: string): void => {
    dispatch({ type: 'DELETE_CREW', crewId });
  }, []);

  const addAgentToCrew = useCallback(
    (
      crewId: string,
      agentInput: Omit<AgentNode, 'id' | 'status' | 'position'> & { id?: string },
    ): AgentNode => {
      const crew = state.crews.find((c) => c.id === crewId);
      const { id: inputId, ...rest } = agentInput;
      const agent: AgentNode = {
        ...rest,
        id: inputId ?? generateId('agent'),
        status: 'idle',
        position: { x: (crew?.agents.length ?? 0) * 200, y: 100 },
      };
      if (crew) {
        const updated: CrewDefinition = {
          ...crew,
          agents: [...crew.agents, agent],
          updatedAt: Date.now(),
        };
        dispatch({ type: 'REPLACE_CREW', crew: updated });
      }
      return agent;
    },
    [state.crews],
  );

  const updateAgentInCrew = useCallback(
    (crewId: string, agentId: string, updates: Partial<Omit<AgentNode, 'id'>>): void => {
      const crew = state.crews.find((c) => c.id === crewId);
      if (!crew) return;
      const updated: CrewDefinition = {
        ...crew,
        agents: crew.agents.map((a) => (a.id === agentId ? { ...a, ...updates } : a)),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'REPLACE_CREW', crew: updated });
    },
    [state.crews],
  );

  const removeAgentFromCrew = useCallback(
    (crewId: string, agentId: string): void => {
      const crew = state.crews.find((c) => c.id === crewId);
      if (!crew) return;
      const updated: CrewDefinition = {
        ...crew,
        agents: crew.agents.filter((a) => a.id !== agentId),
        tasks: crew.tasks.map((t) => (t.agentId === agentId ? { ...t, agentId: '' } : t)),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'REPLACE_CREW', crew: updated });
    },
    [state.crews],
  );

  const addTaskToCrew = useCallback(
    (crewId: string, taskInput: Omit<TaskNode, 'id' | 'status'>): TaskNode => {
      const crew = state.crews.find((c) => c.id === crewId);
      const task: TaskNode = {
        ...taskInput,
        id: generateId('task'),
        status: 'pending',
      };
      if (crew) {
        const updated: CrewDefinition = {
          ...crew,
          tasks: [...crew.tasks, task],
          updatedAt: Date.now(),
        };
        dispatch({ type: 'REPLACE_CREW', crew: updated });
      }
      return task;
    },
    [state.crews],
  );

  const updateTaskInCrew = useCallback(
    (crewId: string, taskId: string, updates: Partial<Omit<TaskNode, 'id'>>): void => {
      const crew = state.crews.find((c) => c.id === crewId);
      if (!crew) return;
      const updated: CrewDefinition = {
        ...crew,
        tasks: crew.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'REPLACE_CREW', crew: updated });
    },
    [state.crews],
  );

  const removeTaskFromCrew = useCallback(
    (crewId: string, taskId: string): void => {
      const crew = state.crews.find((c) => c.id === crewId);
      if (!crew) return;
      const updated: CrewDefinition = {
        ...crew,
        tasks: crew.tasks.filter((t) => t.id !== taskId),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'REPLACE_CREW', crew: updated });
    },
    [state.crews],
  );

  const addWorkflowToCrew = useCallback(
    (crewId: string, workflowId: string): void => {
      const crew = state.crews.find((c) => c.id === crewId);
      if (!crew || crew.workflowIds.includes(workflowId)) return;
      const updated: CrewDefinition = {
        ...crew,
        workflowIds: [...crew.workflowIds, workflowId],
        workflows: [
          ...(crew.workflows ?? []),
          {
            id: workflowId,
            name: `Workflow ${workflowId.slice(0, 8)}`,
            description: '',
            createdAt: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      };
      dispatch({ type: 'REPLACE_CREW', crew: updated });
    },
    [state.crews],
  );

  const importCrewFromWorkflow = useCallback(
    (name: string, description: string, agents: AgentNode[], tasks: TaskNode[]): CrewDefinition => {
      const now = Date.now();
      const crew: CrewDefinition = {
        id: generateId('crew'),
        name,
        description,
        agents,
        tasks,
        workflowIds: [],
        workflows: [],
        color: pickColor(state.crews.length),
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_CREW', crew });
      return crew;
    },
    [state.crews.length],
  );

  const value = useMemo<CrewContextValue>(
    () => ({
      ...state,
      createCrew,
      updateCrew,
      deleteCrew,
      addAgentToCrew,
      updateAgentInCrew,
      removeAgentFromCrew,
      addTaskToCrew,
      updateTaskInCrew,
      removeTaskFromCrew,
      addWorkflowToCrew,
      getCrewById,
      importCrewFromWorkflow,
    }),
    [
      state,
      createCrew,
      updateCrew,
      deleteCrew,
      addAgentToCrew,
      updateAgentInCrew,
      removeAgentFromCrew,
      addTaskToCrew,
      updateTaskInCrew,
      removeTaskFromCrew,
      addWorkflowToCrew,
      getCrewById,
      importCrewFromWorkflow,
    ],
  );

  return React.createElement(CrewContext.Provider, { value }, children);
}
