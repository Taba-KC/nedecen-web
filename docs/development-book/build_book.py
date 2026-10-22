from pathlib import Path
import re, json, hashlib, textwrap, subprocess
from collections import Counter
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from reference_data import TABLES, COMMON_FIELDS, BACKEND_FILES, FRONTEND_FILES, CONFIG_NOTES, GLOSSARY

HERE = Path(__file__).resolve().parent
WEB = HERE.parent.parent
BACK = WEB.parent / 'Project-Edu-Revo'
OUT = HERE / 'NEDECEN Development Journey.docx'
QA = HERE / '.qa'
QA.mkdir(exist_ok=True)

def clean(s):
    return s.replace('\u2014', ' - ').replace('\u2013', '-').replace('\u00a0',' ').replace('\t','  ')

def read(p):
    return p.read_text(encoding='utf-8-sig',errors='replace')

def git(root, *args):
    result=subprocess.run(['git','-c','safe.directory='+str(root),'-C',str(root),*args],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if result.returncode: raise RuntimeError(result.stderr)
    return result.stdout.strip()

def core_files(root):
    exts={'.ts','.tsx','.css','.sql'}
    return sorted(p for p in (root/'src').rglob('*') if p.is_file() and p.suffix in exts and 'meta' not in p.parts)

backfiles=core_files(BACK)
webfiles=core_files(WEB)
source_records=[]
doc=Document()
section=doc.sections[0]
section.page_width=Inches(8.27); section.page_height=Inches(11.69)
section.top_margin=Inches(.78); section.bottom_margin=Inches(.7)
section.left_margin=Inches(.82); section.right_margin=Inches(.82)
section.header_distance=Inches(.3); section.footer_distance=Inches(.3)
styles=doc.styles
for name in ['Normal','Body Text','Title','Subtitle','Heading 1','Heading 2','Heading 3','Heading 4','Caption']:
    st=styles[name]; st.font.name='Calibri'; st.font.color.rgb=RGBColor(0,0,0)
    if st.element.rPr is not None:
        for e in list(st.element.rPr):
            if e.tag==qn('w:color'):
                for a in ['themeColor','themeShade','themeTint']:
                    e.attrib.pop(qn('w:'+a),None)
styles['Normal'].font.size=Pt(11)
styles['Normal'].paragraph_format.line_spacing=1.14
styles['Normal'].paragraph_format.space_after=Pt(8)
styles['Normal'].paragraph_format.widow_control=True
styles['Title'].font.size=Pt(32)
styles['Title'].font.bold=True
styles['Title'].paragraph_format.space_after=Pt(16)
styles['Subtitle'].font.size=Pt(15)
styles['Heading 1'].font.size=Pt(24)
styles['Heading 1'].paragraph_format.page_break_before=True
styles['Heading 1'].paragraph_format.space_after=Pt(18)
styles['Heading 2'].font.size=Pt(16)
styles['Heading 2'].paragraph_format.space_before=Pt(18)
styles['Heading 2'].paragraph_format.space_after=Pt(8)
styles['Heading 3'].font.size=Pt(12)
styles['Heading 3'].paragraph_format.space_before=Pt(12)
styles['Heading 3'].paragraph_format.space_after=Pt(5)
for name in ['Heading 1','Heading 2','Heading 3']:
    styles[name].paragraph_format.keep_with_next=True
if 'Source' not in styles:
    styles.add_style('Source',1)
styles['Source'].font.name='Consolas'; styles['Source'].font.size=Pt(8)
styles['Source'].paragraph_format.line_spacing=Pt(9.5)
styles['Source'].paragraph_format.space_before=Pt(0)
styles['Source'].paragraph_format.space_after=Pt(0)
styles['Source'].paragraph_format.widow_control=False
styles['Source'].paragraph_format.keep_with_next=False
if 'Source Label' not in styles: styles.add_style('Source Label',1)
styles['Source Label'].font.name='Calibri'; styles['Source Label'].font.size=Pt(9)
styles['Source Label'].font.color.rgb=RGBColor.from_string('545454')
styles['Source Label'].paragraph_format.space_after=Pt(6)
styles['Source Label'].paragraph_format.keep_with_next=False
if 'Glossary' not in styles: styles.add_style('Glossary',1)
styles['Glossary'].font.name='Calibri'; styles['Glossary'].font.size=Pt(10.5)
styles['Glossary'].paragraph_format.space_after=Pt(6)
styles['Glossary'].paragraph_format.line_spacing=1.08
# Remove built-in template borders as well as direct formatting.
for st in styles:
    for border in list(st.element.iter(qn('w:pBdr'))): border.getparent().remove(border)

header=section.header.paragraphs[0]
header.text='NEDECEN  |  Application development and source companion'
header.style='Source Label'
footer=section.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
run=footer.add_run(); run.font.size=Pt(9)
field=OxmlElement('w:fldSimple'); field.set(qn('w:instr'),'PAGE');run._r.addnext(field)
doc.core_properties.title='NEDECEN Application Development'
doc.core_properties.subject='Backend and frontend engineering journey with source reference'
doc.core_properties.author=''
doc.core_properties.keywords='NEDECEN, PostgreSQL, Express, Next.js, React, development'

def para(text, style=None):
    return doc.add_paragraph(clean(text),style)

def h(text, level=2):
    text=re.sub(r'[^\w\s]',' ',text)
    return doc.add_heading(re.sub(r'\s+',' ',text).strip(),level)

def md(path, skip_title=False):
    text=read(path)
    for block in re.split(r'\n\s*\n',text.strip()):
        if block.startswith('# '):
            if not skip_title: h(block[2:].strip(),1)
        elif block.startswith('## '): h(block[3:].strip(),2)
        elif block.startswith('### '): h(block[4:].strip(),3)
        else: para(' '.join(block.splitlines()))

def table(headers, rows, widths):
    t=doc.add_table(rows=1,cols=len(headers))
    t.autofit=False
    for cell,width in zip(t.rows[0].cells,widths): cell.width=Inches(width)
    for i,v in enumerate(headers): t.rows[0].cells[i].text=clean(str(v))
    for values in rows:
        cells=t.add_row().cells
        for c,w,v in zip(cells,widths,values): c.width=Inches(w); c.text=clean(str(v))
    for ri,row in enumerate(t.rows):
        trPr=row._tr.get_or_add_trPr()
        if ri==0: trPr.append(OxmlElement('w:tblHeader'))
        trPr.append(OxmlElement('w:cantSplit'))
        for ci,c in enumerate(row.cells):
            c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            tcPr=c._tc.get_or_add_tcPr()
            borders=OxmlElement('w:tcBorders')
            for edge in ['top','left','bottom','right']:
                e=OxmlElement('w:'+edge); e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'D9D9D9');borders.append(e)
            tcPr.append(borders)
            margins=OxmlElement('w:tcMar')
            for edge in ['top','left','bottom','right']:
                e=OxmlElement('w:'+edge);e.set(qn('w:w'),'90');e.set(qn('w:type'),'dxa');margins.append(e)
            tcPr.append(margins)
            shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'E7EBE5' if ri==0 else ('F6F7F4' if ri%2==0 else 'FFFFFF'));tcPr.append(shade)
            for p in c.paragraphs:
                p.paragraph_format.space_after=Pt(3);p.paragraph_format.space_before=Pt(3)
                p.paragraph_format.line_spacing=1.05
                p.paragraph_format.keep_with_next=ri==0
                for r in p.runs:r.font.size=Pt(9);r.bold=ri==0
    para('')
    return t

def code(text):
    for i,line in enumerate(text.splitlines(),1):
        line=clean(line)
        if re.match(r'^\s*(//\s*)?[─━═\-]{12,}',line):
            line=re.sub(r'[─━═]{4,}','---',line)
        chunks=textwrap.wrap(line,width=94,expand_tabs=False,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False) or ['']
        # Keep only the first physical segment numbered, preserving original source line identities.
        for j,chunk in enumerate(chunks):
            p=doc.add_paragraph((f'{i:4d} | ' if j==0 else '     | ')+chunk,'Source')
            for r in p.runs:
                r._r.get_or_add_rPr().append(OxmlElement('w:noProof'))

def line_ranges(source, relative):
    lines=source.splitlines()
    imports=[i for i,s in enumerate(lines,1) if s.lstrip().startswith('import ')]
    funcs=[]
    for i,s in enumerate(lines,1):
        m=re.search(r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)',s)
        if m: funcs.append((i,m.group(1)))
    notes=[]
    if imports:
        notes.append(f'Lines {imports[0]} to {imports[-1]} establish dependencies. Follow relative imports into this repository and package imports into the installed dependency tree.')
    if funcs:
        notes.append('Function entry points: '+ '; '.join(f'{name} at line {line}' for line,name in funcs)+'.')
    if '"use client"' in source or "'use client'" in source:
        notes.append('The client directive selects the browser-capable component boundary used for state, effects or browser APIs.')
    return notes

def source_file(root,path,notes):
    rel=path.relative_to(root).as_posix()
    src=read(path)
    h(rel.replace('/',' ').replace('.',' '),3)
    para(root.name+'/'+rel,'Source Label').paragraph_format.keep_with_next=True
    para(notes).paragraph_format.keep_with_next=True
    for note in line_ranges(src,rel):para(note,'Source Label').paragraph_format.keep_with_next=True
    code(src)
    source_records.append({'repository':root.name,'path':rel,'lines':len(src.splitlines()),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})

def schema_dict():
    h('Every current database table and column',1)
    para('This dictionary follows the current TypeScript schema. Each source path is printed with the corresponding table. SQL migrations may add rules, such as triggers or checks, beyond the TypeScript declaration. The table lists below describe declaration intent rather than asserting that an uninspected running database has already applied every migration.')
    found=[]
    for path in sorted((BACK/'src/db/schema').glob('*.ts')):
        src=re.sub(r'/\*.*?\*/','',read(path),flags=re.S)
        match=re.search(r"pgTable\(['\"]([^'\"]+)",src)
        if not match:continue
        name=match.group(1);found.append(name)
        purpose, overrides=TABLES[name]
        h(name.replace('_',' '),2);para(purpose).paragraph_format.keep_with_next=True
        para('Project-Edu-Revo/'+path.relative_to(BACK).as_posix(),'Source Label').paragraph_format.keep_with_next=True
        rows=[]
        for fm in re.finditer(r"^\s*(\w+)\s*:\s*(serial|integer|text|timestamp|date|boolean)\(['\"]([^'\"]+)['\"]\)([^\n]*)",src,re.M):
            prop,typ,col,tail=fm.groups()
            rules=['required' if '.notNull()' in tail or '.primaryKey()' in tail else 'nullable']
            if '.primaryKey()' in tail: rules.append('primary key')
            if '.unique()' in tail:rules.append('unique')
            if '.defaultNow()' in tail:rules.append('default now')
            dm=re.search(r'\.default\(([^)]+)\)',tail)
            if dm:rules.append('default '+dm.group(1))
            fk=re.search(r'\.references\(\(\) => (\w+)\.(\w+)\)',tail)
            if fk:rules.append('references '+fk.group(1)+'.'+fk.group(2))
            meaning=overrides.get(prop,COMMON_FIELDS.get(prop))
            if not meaning:raise ValueError('Missing field rationale '+name+'.'+prop)
            rows.append((prop+'\n'+col,typ+'\n'+', '.join(rules),meaning))
        table(['Application and SQL name','Type and declaration','Purpose in this platform'],rows,[1.35,1.65,3.6])
        constraints=src[match.end():]
        constraints=re.sub(r'//[^\n]*','',constraints)
        special=[]
        if name=='grades':special=['Unique schoolId and number; supported number 8 to 12. Migration 0016 also provisions and protects the fixed set.']
        elif name=='subjects':special=['name is unique and a normalized expression index also rejects names differing only in case or repeated surrounding/internal whitespace.']
        elif name=='concepts':special=['The composite foreign key (topicId, chapterId) points to topics(id, chapterId), preventing inconsistent parents.']
        elif name=='topics':special=['The unique pair (id, chapterId) supports the composite concept parent reference.']
        else:
            for cm in re.finditer(r'unique\([^)]*\)\.on\(([^)]+)\)',src):special.append('Unique combination: '+cm.group(1).replace('table.','').replace('t.','')+'.')
        for s in special:para(s,'Source Label')
    assert set(found)==set(TABLES),(set(found)^set(TABLES))
    return len(found)

def route_catalog():
    h('HTTP route reference',1)
    para('Read each route together with its router middleware and service. The declared paths below are extracted from source. A source entry is not proof of sufficient authorization. learnerImport.ts is retained but unmounted. Generated dashboard and roster paths are expanded explicitly after the per-file lists.')
    for p in sorted((BACK/'src/routes').glob('*.ts')):
        src=read(p)
        if p.stem=='dashboards':continue
        routes=[]
        for m in re.finditer(r"router\.(get|post|patch|delete|put)\s*\(\s*(['\"])(.*?)\2",src,re.S):
            if '\n' in m.group(3):continue
            line=src[:m.start()].count('\n')+1
            routes.append((m.group(1).upper(),m.group(3),str(line)))
        if not routes:continue
        h(p.stem+' routes',2)
        para(BACKEND_FILES.get(p.relative_to(BACK).as_posix(),'')).paragraph_format.keep_with_next=True
        table(['Method','Declared address','Line'],routes,[.65,5.4,.55])
    h('Generated route families',2)
    table(['Method','Address','Purpose'],[
        ('GET','/staff/me/dashboard','Teacher overview'),('GET','/learners/me/dashboard','Learner overview'),
        ('POST','/schools/:schoolId/people/import/preview','Staff spreadsheet preview'),('POST','/schools/:schoolId/people/import/commit','Reviewed staff commit'),
        ('POST','/schools/:schoolId/classes/:classId/learners/import/preview','Learner preview'),('POST','/schools/:schoolId/classes/:classId/learners/import/commit','Reviewed learner commit'),
        ('POST','/schools/:schoolId/people/import','Direct upload rejected'),('POST','/schools/:schoolId/classes/:classId/learners/import','Direct upload rejected'),
    ],[.6,4.5,1.5])

def tests(root):
    h('Scripts and verification files in '+root.name,2)
    para('These files are part of the maintenance surface. Their paths and assertion focus are indexed here. Read database setup and cleanup before executing a script. Listing a check here does not report that it has been run during document production.')
    for p in sorted((root/'scripts').glob('*')):
        if not p.is_file():continue
        src=read(p)
        label=p.name.replace('.',' ').replace('-',' ')
        h(label,3);para(root.name+'/scripts/'+p.name,'Source Label')
        if p.stem=='seed':note='Insert the sample geographic hierarchy and school. This is content setup, not a complete manager/principal account installer, and reruns can conflict with existing unique data.'
        elif 'cleanup' in p.stem:note='Maintenance utility for existing chapter data. Inspect its delete/update statements and target database before use; it is not an application request handler.'
        else:
            assertions=re.findall(r'assert\.(\w+)',src)
            note='Verification focus: '+p.stem.replace('test-','').replace('-',' ')+'. The script contains '+str(len(assertions))+' assertion call sites'
            if assertions:note+=' using '+', '.join(sorted(set(assertions)))
            note+='.'
            if 'http' in p.stem:note+=' It includes the HTTP boundary rather than only direct service calls.'
            if 'Rollback' in src or 'ROLLBACK' in src:note+=' Fixture cleanup includes a rollback pattern; inspect all setup paths before assuming a particular execution is harmless.'
        para(note)

def files_reference(root,files,purposes,frontend=False):
    h(('Frontend' if frontend else 'Backend')+' complete numbered source companion',1)
    para('Each listing uses original file line numbers. Continuation lines repeat a vertical bar without a new number. Typography in comments and string literals is normalized to avoid em dashes in this book; the working repository remains the authority for exact source bytes. Read the file purpose and function entry points first, then trace each numbered statement against the earlier narrative and worked readings. The listings include retained compatibility code so it can be distinguished from the current execution path.')
    groups={}
    for p in files:
        rel=p.relative_to(root).as_posix()
        if '/db/schema/' in '/'+rel:group='Database schema source'
        elif '/db/migrations/' in '/'+rel:group='Database migration SQL'
        elif '/services/' in '/'+rel:group='Business services'
        elif '/routes/' in '/'+rel:group='HTTP routers'
        elif '/books/' in '/'+rel:group='Principal book system'
        elif '/shared/' in '/'+rel:group='Shared controls'
        elif '/dashboard/' in '/'+rel and '/components/' in '/'+rel:group='Teaching and learner components'
        elif '/principal/' in '/'+rel and '/components/' in '/'+rel:group='Principal widgets and retained components'
        elif '/onboarding/' in '/'+rel:group='Account claim components'
        elif rel.startswith('src/app/'):group='Frontend routes and global styles'
        else:group='Startup middleware and shared logic'
        groups.setdefault(group,[]).append(p)
    for group,paths in groups.items():
        h(group,2)
        for path in paths:
            rel=path.relative_to(root).as_posix()
            note=purposes.get(rel)
            if rel.startswith('src/db/schema/'):
                m=re.search(r"pgTable\(['\"]([^'\"]+)",read(path))
                if m:note=TABLES[m.group(1)][0]+' The dictionary explains each field; the declaration below shows its exact TypeScript and SQL mapping.'
                elif path.name=='index.ts':note='Re-export the live table declarations through one module. A barrel export simplifies imports but creates no additional database table.'
                elif path.name=='teachers.ts':note='Historical placeholder only. Staff are now represented by people.ts; this file declares no table.'
            elif path.suffix=='.sql':
                stmts=[x.strip()[:140] for x in read(path).splitlines() if re.match(r'^(CREATE TABLE|ALTER TABLE|CREATE FUNCTION|CREATE TRIGGER|CREATE UNIQUE|UPDATE |INSERT |DROP )',x)]
                note='Apply this versioned SQL in migration-journal order. Its significant operations begin with: '+'; '.join(stmts[:5])+'. Read all statements below before applying it to an existing database.'
            if not note:raise ValueError('Missing purpose: '+rel)
            source_file(root,path,note)
    h('Build and project configuration',2)
    names=['package.json','tsconfig.json','.gitignore']+(['next.config.ts','postcss.config.mjs','eslint.config.mjs','public/manifest.json'] if frontend else ['drizzle.config.ts'])
    for rel in names:source_file(root,root/rel,CONFIG_NOTES[rel])
    tests(root)

title=para('NEDECEN Application Development','Title')
pb=OxmlElement('w:pBdr');bottom=OxmlElement('w:bottom');bottom.set(qn('w:val'),'nil');pb.append(bottom);title._p.get_or_add_pPr().append(pb)
para('The backend and frontend engineering journey','Subtitle')
para('A practical learning book and complete application source companion')
para('23 October 2026')
para('The platform connects school administration, shared curriculum and concept-level teaching activity. This book begins with the relationships that make that possible, builds the backend first, and then follows those records into the interface. It explains the choices, alternatives, implementation details and limits that matter when learning to maintain the application.')
para('Read Chapters 1 and 2 as a continuous development story. Use the worked readings to connect syntax to behavior, the schema dictionary to understand every column, and the numbered source companions to locate and trace the real files. Word heading navigation and the contents links make the reference sections usable without reading every listing in sequence.')
para('The present-tense narrative gives engineering explanations of the implemented design. Dated changes are tied to Git history, migration SQL or current working diffs. Choices are assessed against this platform\'s requirements, including their tradeoffs, rather than treated as universally best.')

h('Contents',1)
toc=doc.add_paragraph()
field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'TOC \\o "1-2" \\h \\z \\u')
r=OxmlElement('w:r');t=OxmlElement('w:t');t.text='Update this field in Word to refresh page numbers.';r.append(t);field.append(r);toc._p.append(field)
settings=doc.settings.element
uf=OxmlElement('w:updateFields');uf.set(qn('w:val'),'true');settings.append(uf)

md(HERE/'backend.md')
h('An earlier curriculum boundary that changes',2)
para('The first migration stores class_subject_id and teacher_id directly on chapters. That early model makes a chapter belong to one class delivery. Later migrations move the shared chapter identity toward subject and grade, and class_chapters represents delivery-specific assignment. The present shared library avoids reproducing the same curriculum for each class while preserving class-level teacher ownership through links. This is an observed schema evolution, not an assumption that the first schema already had the final boundary.')
md(HERE/'frontend.md')
md(HERE/'walkthroughs.md')
table_count=schema_dict()
route_catalog()

h('Working on the application locally',1)
para('Use a disposable PostgreSQL development database while learning. The following sequence is a setup guide, not a record of commands executed against the current school database. Manager and principal bootstrap accounts need explicit provisioning; no complete bootstrap CLI is provided by the existing seed script.')
table(['Order','Location','Command or action'],[
    ('1','PostgreSQL','Create a development login and empty database; set DATABASE_URL privately.'),
    ('2','Project-Edu-Revo','npm ci'),('3','Project-Edu-Revo','Set DATABASE_URL, JWT_SECRET and PORT in local configuration.'),
    ('4','Project-Edu-Revo','Ensure DATABASE_URL is loaded for drizzle.config.ts; review migrations and run npm run db:migrate.'),
    ('5','Project-Edu-Revo','Run npm run db:seed only on an appropriate fresh database. Provision privileged accounts deliberately.'),
    ('6','Project-Edu-Revo','npm run dev'),('7','nedecen-web','npm ci'),
    ('8','nedecen-web','Set NEXT_PUBLIC_API_URL=http://localhost:3000 in .env.local if using the default backend.'),
    ('9','nedecen-web','npm run dev -- --port 3001'),
    ('10','Browser','Open http://localhost:3001 and inspect API requests in browser developer tools.'),
    ('11','Both repositories','Run appropriate isolated checks, type checking and production builds before deployment.'),
],[.5,1.3,4.8])
para('Do not start both processes on port 3000. The backend default is 3000 and the CORS rule expects the interface at 3001. The generated frontend README still describes a default Create Next App port; the application-specific configuration explains the actual two-process arrangement.')
para('For backend schema changes: edit src/db/schema, generate a migration, review SQL and data backfill, apply it to a disposable database, then update services, runtime schemas, API responses, frontend types and controls. Generated snapshots and the migration journal are part of migration tooling; manual SQL migrations must be journaled consistently. The existence of a migration file alone does not prove it has run on a particular database.')

h('Terms introduced by the application',1)
for term,meaning in GLOSSARY.items():
    p=doc.add_paragraph(style='Glossary');p.add_run(term+'. ').bold=True;p.add_run(meaning)

h('Source edition and navigation map',1)
para('The source companions print authored .ts, .tsx, .css and migration .sql files under both src directories, plus selected build configuration. Private .env contents, installed dependency internals, package-lock records, generated migration snapshots, build output, uploaded documents and binary assets are not reproduced. Test and maintenance scripts are indexed with their purpose rather than expanded into the teaching narrative.')
table(['Repository','Inspected HEAD','Application and migration files'],[
    (BACK.name,git(BACK,'rev-parse','--short','HEAD'),len(backfiles)),(WEB.name,git(WEB,'rev-parse','--short','HEAD'),len(webfiles))
],[2,1.6,3])
para('The edition includes working source changes as inspected during preparation. Relevant backend edits include class-photo removal and class curriculum coverage. Relevant frontend edits include contextual actions, curriculum coverage and rolling-fold page motion. Existing application edits are preserved; this document adds learning material only.')
h('Documented development milestones',2)
for root in [BACK,WEB]:
    h(root.name+' history',3)
    for line in git(root,'log','--date=short','--format=%h %ad %s','-20').splitlines():para(line,'Source Label')
h('Repository guides and framework documentation',2)
for path in ['Project-Edu-Revo/docs/principal-dashboard-spec.md','Project-Edu-Revo/docs/app-manager-curriculum.md','nedecen-web/docs/principal-dashboard-spec.md','nedecen-web/docs/principal-books.md','nedecen-web/node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md','nedecen-web/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md','nedecen-web/node_modules/next/dist/docs/01-app/02-guides/environment-variables.md']:
    para(path,'Source Label')
para('The principal dashboard specification describes several product decisions at an earlier stage. Current source, migrations and the principal books guide take precedence where behavior has changed. The installed framework guides explain the conventions used by this exact checkout.')

files_reference(BACK,backfiles,BACKEND_FILES)
files_reference(WEB,webfiles,FRONTEND_FILES,True)

h('Source integrity index',1)
para('Original paths and line counts allow a reader to compare this edition with later edits. The SHA256 fingerprints are stored in the local source manifest alongside the builder, so the source snapshot can be checked without treating typographically normalized printed listings as executable copies.')
table(['Repository and source path','Lines'],[(r['repository']+'/'+r['path'],str(r['lines'])) for r in source_records],[5.9,.7])

doc.save(OUT)
manifest={'date':'2026-10-23','database_tables':table_count,'application_files':len(backfiles)+len(webfiles),'source_files_with_config':len(source_records),'source_lines':sum(x['lines'] for x in source_records),'files':source_records}
(QA/'source_manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
alltext='\n'.join(p.text for p in doc.paragraphs)+'\n'+'\n'.join(c.text for t in doc.tables for row in t.rows for c in row.cells)
assert '\u2014' not in alltext
stats={'path':str(OUT),'paragraphs':len(doc.paragraphs),'tables':len(doc.tables),'words':len(alltext.split()),**{k:v for k,v in manifest.items() if k!='files'}}
(QA/'book_stats.json').write_text(json.dumps(stats,indent=2),encoding='utf-8')
print(json.dumps(stats,indent=2))
