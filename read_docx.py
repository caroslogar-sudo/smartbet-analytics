import zipfile
import xml.etree.ElementTree as ET
try:
    with zipfile.ZipFile('Documento de especificación de requisitos.docx') as z:
        d = z.read('word/document.xml')
    t = ET.XML(d)
    paragraphs = []
    for p in t.iter():
        if p.tag.endswith('}p'):
            t_nodes = [n.text for n in p.iter() if n.tag.endswith('}t') and n.text]
            if t_nodes:
                paragraphs.append("".join(t_nodes))
    with open('output.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(paragraphs))
except Exception as e:
    print(e)
