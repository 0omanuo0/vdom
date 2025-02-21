// VNode class represents a Virtual DOM node
class VNode {
    constructor(tag, props = {}, children = []) {
        this.tag = tag;           // Element tag (e.g., "div", "p", "button")
        this.props = props;       // Element attributes (e.g., { id: "myDiv", class: "container" })
        this.children = children; // Array of child VNodes
        this.dom = null;          // Reference to the actual DOM node
    }
}

/**
 * h function (hyperscript) - Creates a virtual node
 * Similar to React.createElement, this function generates a VNode.
 * 
 * @param {string} tag - The HTML tag (e.g., "div", "p")
 * @param {object} props - Attributes (e.g., { class: "box" })
 * @param {...VNode|string} children - Child nodes (VNode instances or text)
 * @returns {VNode} - A virtual node
 */
function h(tag, props, ...children) {
    return new VNode(tag, props, children.flat().flatMap(child => {
        if (Array.isArray(child)) {
            return child.flatMap(c => 
                c instanceof VNode ? c : new VNode("#text", {}, c)
            );  // Flatten nested arrays and convert elements to VNode
        }
        else if (child instanceof VNode) {
            return child;
        }
        else if (typeof child === "number") {
            return new VNode("#text", {}, child.toString());
        }
        
        return new VNode("#text", {}, String(child));
    }));
}


/**
 * Render function - Converts a Virtual DOM tree into a real DOM tree
 * 
 * @param {VNode} vnode - The virtual node to be rendered
 * @returns {HTMLElement|Text} - The corresponding real DOM element
 */
function render(vnode) {
    if (vnode.tag === "#text") {
        const textNode = document.createTextNode(vnode.children);
        vnode.dom = textNode;
        console.log("text", vnode.children);
        return textNode;
    }
    else if (vnode.tag === "#html") {
        // Wrap HTML in a container element instead of using a DocumentFragment
        const container = document.createElement('div');
        container.innerHTML = vnode.children.map(child => child.children).join("");
        vnode.dom = container;
        return container;
    }

    const domNode = document.createElement(vnode.tag);
    vnode.dom = domNode;

    // Apply attributes and event listeners
    Object.keys(vnode.props || {}).forEach((key) => {
        if (key.startsWith("on")) {
            domNode[key.toLowerCase()] = vnode.props[key]; // Set event handlers
        }
        else if (key === "className") {
            domNode.setAttribute("class", vnode.props[key]); // Set class attribute
        }
        else {
            domNode[key] = vnode.props[key]; // Set other attributes
        }
    });

    // Recursively render children and append to parent
    vnode.children.forEach(child => domNode.appendChild(render(child)));

    return domNode;
}

/**
 * Patch function - Updates the real DOM based on Virtual DOM differences
 * 
 * @param {HTMLElement} parent - The parent DOM element
 * @param {VNode} oldVnode - The previous Virtual DOM node
 * @param {VNode} newVnode - The new Virtual DOM node
 * @returns {VNode} - The updated Virtual DOM node
 */
function patch(parent, oldVnode, newVnode) {
    if (!oldVnode) {
        parent.appendChild(render(newVnode));
        return newVnode;
    }

    if (!newVnode) {
        parent.removeChild(oldVnode.dom);
        return null;
    }

    // Replace node if tag type changes
    if (oldVnode.tag !== newVnode.tag) {
        const newDom = render(newVnode);
        parent.replaceChild(newDom, oldVnode.dom);
        return newVnode;
    }

    const el = oldVnode.dom;
    newVnode.dom = el;

    // Update text content for text nodes
    if (newVnode.tag === "#text") {
        if (oldVnode.children !== newVnode.children) {
            el.textContent = newVnode.children;
        }
        return newVnode;
    }
    else if (newVnode.tag === "#html") {
        if (oldVnode.children[0].children !== newVnode.children[0].children) {
            el.innerHTML = newVnode.children[0].children;
        }
        return newVnode;
    }


    // Update attributes and event listeners
    Object.keys(newVnode.props || {}).forEach((key) => {
        if (key.startsWith("on")) {
            if (oldVnode.props[key] !== newVnode.props[key]) {
                el[key.toLowerCase()] = newVnode.props[key];
            }
        } else {
            el[key] = newVnode.props[key];
        }
    });

    // Patch children recursively
    const oldChildren = oldVnode.children;
    const newChildren = newVnode.children;
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        patch(el, oldChildren[i], newChildren[i]);
    }

    return newVnode;
}





/**
 * Component class - Implements a simple component system
 * Allows stateful components with automatic re-rendering when state updates.
 */
class Component {
    constructor(props, parent, component_render, componentId = "",) {
        this.componentId = componentId || Math.random().toString(36).slice(2);

        this.props = props;
        this.parent = parent;
        this.vnode = null;
        this.state = [];
        this.stateIndex = 0;
        this.component_render = component_render.bind(this);

        this.effects = [];                  // Store effect functions and dependencies
        this.prevDependencies = [];         // Store previous dependencies
        this.cleanupEffects = [];           // Store cleanup functions

        this.actions = {}

        this.update();
    }

    useState(initialValue) {
        const index = this.stateIndex;

        if (this.state[index] === undefined) {
            this.state[index] = initialValue;
        }

        const setState = (newValue) => {
            this.state[index] = newValue;
            this.update();
        };

        this.stateIndex++;
        return [this.state[index], setState];
    }

    /**
     * useEffect hook - Runs side effects when dependencies change
     * 
     * @param {Function} effect - Effect function to run
     * @param {Array} dependencies - List of dependencies to watch
     */
    useEffect(effect, dependencies) {

        requestAnimationFrame(() => {
            const index = this.effects.length;
            const prevDeps = this.prevDependencies[index];

            const hasChanged = !prevDeps || dependencies.some((dep, i) => dep !== prevDeps[i]);

            if (hasChanged) {
                if (this.cleanupEffects[index]) {
                    this.cleanupEffects[index](); // Run cleanup function if exists
                }

                this.cleanupEffects[index] = effect(); // Store new cleanup function
            }

            this.effects[index] = effect;
            this.prevDependencies[index] = dependencies;
        });
    }

    /**
    * Calls a server action, sending a request to /server_/<component_id>/<action_id>
    * 
    * @param {string} actionId - Action identifier
    * @param {object} data - Payload to send to the server
    */
    async setAction(actionId, data, callback) {
        try {
            const response = await fetch(`/server_/${this.componentId}/${actionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            console.log(`Server response for ${actionId}:`, result);

            if (callback) {
                callback(result);
            }
        } catch (error) {
            callback({ error: error.message });
        }
    }

    update() {
        this.stateIndex = 0;
        const newVnode = this.component_render(this.props);
        this.vnode = patch(this.parent, this.vnode, newVnode);

        // Run effects after render
        requestAnimationFrame(() => {
            this.effects.forEach((effect, index) => {
                const dependencies = this.prevDependencies[index];
                const prevDeps = this.prevDependencies[index];

                const hasChanged = !prevDeps || dependencies.some((dep, i) => dep !== prevDeps[i]);

                if (hasChanged) {
                    if (this.cleanupEffects[index]) {
                        this.cleanupEffects[index](); // Run cleanup if any
                    }

                    this.cleanupEffects[index] = effect(); // Run the effect and store cleanup

                }
            });
        });
    }
}



export { h, render, patch, Component };