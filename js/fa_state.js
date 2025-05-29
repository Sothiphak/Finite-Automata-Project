// js/fa_state.js
class State {
    constructor(name, isFinal = false) {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new Error("State name must be a non-empty string.");
        }
        this.name = name.trim();
        this.isFinal = !!isFinal; // Ensure boolean

        // For visualization later (optional initial positions)
        // this.x = Math.random() * 500;
        // this.y = Math.random() * 300;
    }

    toString() {
        return `State(${this.name}, Final: ${this.isFinal})`;
    }
}