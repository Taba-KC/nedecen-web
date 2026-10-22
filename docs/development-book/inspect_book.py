from zipfile import ZipFile
from lxml import etree as E
from pathlib import Path
p=Path(__file__).resolve().parent/'NEDECEN Development Journey.docx'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(p) as z:
 for n in ['word/document.xml','word/styles.xml']:
  root=E.fromstring(z.read(n))
  borders=root.xpath('//w:pBdr',namespaces=ns)
  print(n, 'borders',len(borders))
  for e in borders[:4]:print(E.tostring(e.getparent(),encoding='unicode')[:1600])
  if n.endswith('document.xml'):
   for e in root.xpath('//w:body/w:p',namespaces=ns)[:3]:print(E.tostring(e,encoding='unicode')[-1800:])
