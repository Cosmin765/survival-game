path = "./../"
output_path = "./output/"

html = open(path + "index.html", "r")
lines = html.readlines()
html.close()

script_start = 13
script_end = 23 # not inclusive

script_lines = lines[script_start : script_end]

# merge the js files
output_js = open(output_path + "main.js", "w")
for line in script_lines:
    filename = line[line.find("src") + 5 : line.find("\">")]
    with open(path + filename, "r") as js_file:
        output_js.write("".join(js_file.readlines()) + "\n")
output_js.close()   

script_lines.pop()

# copying the html file
output_html = open(output_path + "index.html", "w")
for line in lines:
    if line not in script_lines:
        output_html.write(line)
output_html.close()

# copying the css file
output_css = open(output_path + "main.css", "w")
input_css = open(path + "main.css", "r")
for line in input_css.readlines():
    output_css.write(line)
output_css.close()