from bs4 import BeautifulSoup

# Read the Vue file
with open("comp.vc", "r", encoding="utf-8") as file:
    content = file.read()

# Parse using 'html.parser' to handle Vue structure properly
soup = BeautifulSoup(content, "html.parser")

# Extract template and script separately
template_content = soup.find("template")
script_content = soup.find("script")



def generate_structure(tag, indent=0):
    """ Recursively prints tag structure with indentation """
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
                t += generate_structure(child, indent + 1)
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



def parse_template(tc):
    k = generate_structure(tc, 1)
    # remove the last comma
    k = k[:-1]
    return k

def parse_script(sc, k):
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
    sc = sc[:index] + "\n\n    return ( " + k + "\n    );" + sc[index:]
    
    index = sc.rfind("}") - 1
    sc = sc[:index] + "\n\n    });" + sc[index:]
    

    sc = sc.replace("useState", "this.useState")
    sc = sc.replace("useEffect", "this.useEffect")
    
    return sc
    
        

# Print results
if template_content:
    # print("Template Section:")
    # print(template_content.prettify()[:30])
    
    k = parse_template(template_content)
    
    # write it in k.js

        
    if script_content:
        # print("\nScript Section:")
        # print(script_content.children.__next__())
        k = parse_script(script_content.children.__next__(), k)
        
        with open("k.js", "w") as file:
            file.write(k)
    
