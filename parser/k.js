import { h, Component } from "../vdom.js";

export default function Counter(props, el) {
    return new Component(props, el, function () {

        const [count, setCount] = this.useState(0);

        function increment() {
            setCount(count + 1);
        }

        function decrement() {
            setCount(count - 1);
        }

        return (h("template", {}, [

            h("div", {}, [

                h("p", {}, [
                    "Contador:",
                    h("span", { id: "counter-value" }, [
                        count
                    ])
                ]),
                Array.from({ length: count * 100 }, (_, i) =>
                    h("button", { onclick: increment() }, [
                        "+",
                        h("p", {}, [
                            a
                        ])
                    ]),
                ),
                h("button", { onclick: decrement() }, [
                    "-"
                ]),
                h("p", {}, [
                    `Texto: ${text}`
                ])
            ])
        ])
        );

    });
}
