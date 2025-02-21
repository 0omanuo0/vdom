from bs4 import BeautifulSoup



def generate_structure(tag, indent=0, other=None):
    """ Recursively prints tag structure with indentation 
        ### Limitations:
        - A child can only be a js expression or a text node
        - JS expressions must be enclosed in curly braces {}"""
    if tag.name:  # Only process valid tags
        t = "h(\"" + tag.name + "\", {"
        for attr in tag.attrs:
            # Handle event attributes differently
            if attr.startswith("on"):
                t += attr + ": " + tag[attr] + ", "
            else:
                t += attr + ": \"" + tag[attr] + "\", "
            
        t = t.rstrip(", ")  # Remove trailing comma
        t += "}, [\n" + "    " * indent

        js_expressions_counter = 0
        
        # Iterate through children
        for child in tag.children:
            if child.name:
                if other is not None and (child.name.capitalize() in other):
                    # just add the name of the component as: Other({props})
                    args = child.attrs
                    parsed_args = {}
                    for k, v in args.items():
                        v.strip()
                        if(v.startswith("{") and v.endswith("}")):
                            parsed_args[k] = v[1:-1]
                        else:
                            parsed_args[k] = "\"" + v + "\""
                    t += child.name.capitalize() + "({" + ", ".join([f"{k}: {v}" for k, v in parsed_args.items()]) + "}), "
                else:
                    t += generate_structure(child, indent + 1, other)
            elif isinstance(child, str):
                # Remove leading and trailing whitespaces
                trimmed_child = child.strip()
                
                if trimmed_child == "" or trimmed_child == "\n" or trimmed_child == "\r": # Skip empty strings
                    t += "\n" + "    " * indent
                    continue
                
                elif trimmed_child.startswith("{") and trimmed_child.endswith("}"): # Handle JS expressions
                    t += trimmed_child[1:-1] + ", "
                    
                elif trimmed_child.startswith("{"): # Handle JS expressions (multiline)
                    t += "\n" + "    " * indent
                    js_expressions_counter += 1
                    t += trimmed_child[1:].strip()
                    indent += 1
                    
                elif trimmed_child.endswith("}") and js_expressions_counter > 0: # Handle JS expressions (end of multiline)
                    js_expressions_counter -= 1
                    indent -= 1
                    t += "\n" + "    " * indent
                    t += trimmed_child[:-1] + ", "
                    
                else: # Handle text nodes
                    # if trimmed_child starts and ends with double quotes, simple quote or ` dont add double quotes
                    if trimmed_child[0] in "\"'`" and trimmed_child[-1] == trimmed_child[0]:
                        t += trimmed_child + ", "
                    else:
                        t += "\"" + trimmed_child + "\", "
                    
                t += "\n" + "    " * indent
                
        t = t.rstrip(", \n")
            
        
        if(js_expressions_counter > 0):
            raise Exception("Unbalanced JS expressions")
        
        t = t.rstrip(", ")  # Remove trailing comma
        t += "\n" + "    " * (indent - 1) + "])," + "    " * (indent - 1)
        return t



def parse_template(tc, other=None):
    k = generate_structure(tc, 1, other=other)
    # remove the last comma
    k = k[:-1]
    return k

def parse_script(sc, k, other=None):
    # 1. add string "import { h, Component } from "../vdom.js";" 
    # 2. add a line after the fist \n with: return new Component(props, el, function () {
    # 3. add at the end before the line "}" "return ( " + k + "\n);"
    # 4. add at the end before the line "}" "});"
    # 5. replace all useState and useEffect with this.useState and this.useEffect
    

    sc = "import { h, Component } from \"../vdom.js\";\n" + str(sc)

    index = sc.find("(props, el) {") + len("(props, el) {")
    sc = sc[:index] + "\n    return new Component(props, el, function () {\n" + sc[index:]

    
    index = sc.rfind("}") - 1
    k = k.replace("\n", "\n    ")
    
    if other is not None:
        t = "\n    "
        for key, value in other.items():
            value = value.replace("\n", "\n    ")
            t += f"const {key} = (props) => {value}\n"
        t += "\n\n    return ( " + k + "\n    );"
        sc = sc[:index] + t + sc[index:]
        
    else:
        sc = sc[:index] + "\n\n    return ( " + k + "\n    );" + sc[index:]
    
    index = sc.rfind("}") - 1
    sc = sc[:index] + "\n\n    });" + sc[index:]
    

    sc = sc.replace("useState", "this.useState")
    sc = sc.replace("useEffect", "this.useEffect")
    
    return sc
    
component_name = "Counter"

# Read the Vue file
with open(component_name + ".vc", "r", encoding="utf-8") as file:
    content = file.read()

# Parse using 'html.parser' to handle Vue structure properly
soup = BeautifulSoup(content, "html.parser")

# Extract template and script separately
template_content = soup.find_all("template")
script_content = soup.find("script")
        

# Print results
if template_content:    
    main_vnode = None
    other_vnode = {}
    
    main_vnode_parsed = None
    other_vnode_parsed = {}
    
    for a in template_content:
        name = list(a.attrs.keys())[0].capitalize()
        a.name = "div"
        a.attrs = {}
        if(name == component_name):
            main_vnode = a
        else:
            other_vnode[name] = a
            
    

    main_vnode_parsed = parse_template(main_vnode, other=other_vnode)
    print(main_vnode_parsed)
    for k, v in other_vnode.items():
        other_vnode_parsed[k] = parse_template(v)
        print(other_vnode_parsed[k])
    

    if script_content:
        # print("\nScript Section:")
        # print(script_content.children.__next__())
        k = parse_script(script_content.children.__next__(), main_vnode_parsed, other=other_vnode_parsed)
        
        with open("k.js", "w") as file:
            file.write(k)
    
