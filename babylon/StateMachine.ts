
interface IState {
    name: string;
    onEnter?: () => void;
    onExit?: () => void;
}

export class StateMachine {
    private _states: Map<string, IState>;
    private readonly _context?: object;
    private _currentState?: IState;

    constructor(context?: object) {
        this._states = new Map<string, IState>();
        this._context = context;
    }

    addState(name: string, config?: { onEnter?: () => void; onExit?: () => void }): void {
        this._states.set(name, {
            name,
            onEnter: config?.onEnter?.bind(this._context),
            onExit: config?.onExit?.bind(this._context),
        })
    }

    setState(name: string): void {
        if (this._currentState?.name === name) return;
        if (this._currentState && this._currentState.onExit) this._currentState.onExit();
        this._currentState = this._states.get(name);
        if (this._currentState?.onEnter) this._currentState.onEnter();
    }

    get state() { return this._currentState?.name }
}