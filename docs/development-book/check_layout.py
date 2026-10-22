from pathlib import Path
import re,json
import pypdfium2 as pdfium
from pypdf import PdfReader
from PIL import Image,ImageDraw

root=Path(__file__).resolve().parent
qa=root/'.qa'
pdfpath=qa/'NEDECEN Development Journey.pdf'
reader=PdfReader(str(pdfpath))
texts=[p.extract_text() or '' for p in reader.pages]
em=[i+1 for i,t in enumerate(texts) if '\u2014' in t]
empty=[i+1 for i,t in enumerate(texts) if len(t.strip())<60]
chapters={}
for key in ['Chapter 1 Building the backend','Chapter 2 Building the frontend','Every current database table and column','Backend complete numbered source companion','Frontend complete numbered source companion']:
    chapters[key]=[i+1 for i,t in enumerate(texts) if key in re.sub(r'\s+',' ',t)]
font_issues=[]
book=pdfium.PdfDocument(str(pdfpath))
renders=qa/'pages';renders.mkdir(exist_ok=True)
sheets=qa/'contact';sheets.mkdir(exist_ok=True)
thumbs=[]
for i in range(len(book)):
    page=book[i]
    bitmap=page.render(scale=1.25)
    im=bitmap.to_pil().convert('RGB')
    im.save(renders/f'page-{i+1:03}.png')
    thumb=im.resize((414,585))
    frame=Image.new('RGB',(434,617),'#e0e0e0');frame.paste(thumb,(10,24))
    ImageDraw.Draw(frame).text((10,6),f'Page {i+1}',fill='black')
    thumbs.append(frame)
    page.close()
    if len(thumbs)==9 or i==len(book)-1:
        sheet=Image.new('RGB',(434*3,617*3),'#b7b7b7')
        for j,img in enumerate(thumbs):sheet.paste(img,((j%3)*434,(j//3)*617))
        num=(i//9)+1
        sheet.save(sheets/f'sheet-{num:02}.png')
        thumbs=[]
    if (i+1)%50==0: print(f'Rendered {i+1} pages',flush=True)
report={'pages':len(book),'em_dash_pages':em,'nearly_empty_pages':empty,'section_pages':chapters,'contact_sheets':len(list(sheets.glob('*.png')))}
(qa/'layout_report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(qa/'extracted_text.txt').write_text('\n\n'.join(f'PAGE {i+1}\n{t}' for i,t in enumerate(texts)),encoding='utf-8')
print(json.dumps(report,indent=2))
