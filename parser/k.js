import { h, Component } from "../vdom.js";

export default function Counter(props, el) {
    return new Component(props, el, function () {

    const [count, setCount] = this.useState(0);


    function decrement() {
        setCount(count - 1);
    }
    const Item = (props) => h("div", {}, [
        
        h("p", {}, [
            props.a
        ])
    ])


    return ( h("div", {}, [
        
        h("p", {}, [
            "Contador:", 
            h("span", {id: "counter-value"}, [
                 count
            ])
        ]),    
        Array.from({ length: count * 100 }, (_, i) =>
            h("button", {onclick: () => setCount(count + 1)}, [
                "+", 
                h("p", {}, [
                    a
                ])
            ]),        
        ) , 
        h("button", {onclick: decrement()}, [
            "-"
        ]),    
        h("p", {}, [
            `Texto: ${text}`
        ]),    
        Item({a: "hola", b: adios})
    ])
    );

    });
}
