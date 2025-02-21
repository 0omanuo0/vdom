import { h, Component } from "../../vdom.js";

export default function Counter(props, el) {
    return new Component(props, el, function () {
        const [count, setCount] = this.useState(props.initialCount || 0);

        return h("div", {}, [
            h("p", {}, `Contador: ${count}`),
            h("button", { onclick: () => setCount(count + 1) }, "+"),
            h("button", { onclick: () => setCount(count > 0 ? count - 1 : 0) }, "-")
        ]);
    })
}
