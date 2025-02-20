# Virtual DOM Library

This is a simple Virtual DOM library implemented in JavaScript. It provides a lightweight and efficient way to create and update the DOM using a virtual representation of the DOM.

## Features

- **VNode Class**: Represents a virtual DOM node.
- **`h` Function**: Hyperscript function to create virtual nodes.
- **Render Function**: Converts a virtual DOM tree into a real DOM tree.
- **Patch Function**: Updates the real DOM based on virtual DOM differences.
- **Component Class**: Implements a simple component system with state and effects.

## Limitations

- No support for recursive components (one component inside another). You can only create functions that return `h()` to create small reusable fragments.
    Example: 
    ```javascript
    let item = (i) => h("div", {}, [
            h("h3", {}, "Item" + i)
        ]);

    // and called as:
    h("div", {}, [item(1)]);
    ```

- The HTML tag cannot interact with states or effects beyond reading the variable of a state.

## Usage

### `h` Function

The `h` function (hyperscript) creates a virtual node.

```typescript
function h(tag : string, props : string[], children any[])
```

### Component Class

The `Component` class implements a simple component system with state and effects.

```typescript
class Component {
    constructor(props : any[], parent : HTMLElement | null, component_render : VNode, componentId = "")

    useEffect(callback : function, dependencies : any[]) : [any, function]

    useState(initialVaule : any) : void

    setAction(actionName : string, data : Object, callback : function) : void 
}
```

## Example

Here is an example of how to use this library in an HTML file:

```html
<script type="module">
    import { h, Component } from "./vdom.js";

    const container = document.getElementById("container");

    const myComponent = new Component({}, container, function () {
        const [count, setCount] = this.useState(0);

        this.useEffect(() => {
            console.log("Count:", count);
            return () => console.log("Component unmounted");
        }, [count]);

        return h("div", { className: "div-main" }, [
            h("div", { style: "display: flex; gap: 14px; align-items: center;" }, [
                (count < 5 ? h("p", {}, `Count: ${count}`) : h("p", {}, "Count greater than 5")),
                h("button", { onclick: () => setCount(count + 1) }, "+"),
                h("button", { onclick: () => setCount(count > 0 ? count - 1 : 0) }, "-"),
            ]),
        ]);
    });
</script>
```

## Sanitization

The `sanitizeHTML` function removes dangerous tags and attributes from HTML input to prevent XSS attacks.

```typescript
function sanitizeHTML(input : string) : string
```

## License

This project is licensed under the MIT License.