/** Shapes sent by the Laravel controllers. All money is integer cents. */

export type GoalSummary = {
    id: number;
    title: string;
    target: number;
    saved: number;
    progress: number;
    weeksLeft: number | null;
    reached: boolean;
};

export type KidSummary = {
    id: number;
    name: string;
    avatar: string;
    balance: number;
    level: number;
    weeklyAllowance: number;
    goal: GoalSummary | null;
};

export type KidRef = { id?: number; name: string; avatar: string };

export type Transaction = {
    id: number;
    type: 'allowance' | 'chore' | 'purchase';
    amount: number;
    note: string | null;
    created_at: string;
};

export type OpenRequest = {
    id: number;
    item: string;
    amount: number;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
};

export type Choice = { title: string; detail?: string | null };

export type ChatMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    choices: Choice[] | null;
};
