import { h, Component } from "../../vdom.js";

export default function Counter(props, el) {
    return new Component(props, el, function () {

    const [count, setCount] = this.useState(0);

    const text = "Hola mundo";

    function decrement() {
        setCount(count - 1);
    }
    const Item = (props) => h("div", {}, [
        
        h("p", {}, [
             (props.a + props.b) , 2
        ])
    ])


    return ( h("div", {}, [
        
        h("p", {}, [
            "Contador:", 
            h("span", {id: "counter-value"}, [
                 count
            ])
        ]),    
        h("button", {onclick: () => setCount(count + 1)}, [
            "+"
        ]),    
        h("button", {onclick: () => decrement()}, [
            "-"
        ]),    
        h("p", {}, [
            `Texto: ${text}`
        ]),    
        Array.from({ length: count * 100 }, (_, i) =>
            Item({a: "hola", b: i}), 
        )
    ])
    );

    });
}
