import MoveLearners from "../MoveLearners";
/**
 * The principal's book catalogue and feature definitions. Each book loads API data, turns it
 * into a page tree, then supplies rows/actions for the selected page. To add a book,
 * register a definition here; change the shared shell in BookWorkspace, not in each feature.
 */
import { api } from "@/lib/api";
import { createElement } from "react";
import ClassStreamsEditor from "../ClassStreamsEditor";
import AdministrativeWorkEditor from "../AdministrativeWorkEditor";
import { ClassCurriculum } from "@/components/principal/ClassCurriculum";
import type { BookData, BookDefinition, BookPage, Command, Field, PageRow, RecordItem } from "./types";
import { classLabel, learnerName, nameOf, optionsOf, streamLabel } from "./types";

const get = (path: string) => api.get<RecordItem[]>(path);
const base = (id: number) => `/schools/${id}`;
/**
 * These helpers describe controls/actions as data. The shared workspace creates the actual
 * HTML from these descriptions.
 */
const text = (name: string, label: string, value = "", required = true): Field => ({ name, label, value, required });
const select = (name: string, label: string, items: RecordItem[], value = "", required = false): Field => ({ name, label, value, required, type: "select", options: optionsOf(items) });
const remove = (label: string, path: string, warning = "This cannot be undone."): Command => ({ label: "Delete", title: `Delete ${label}`, confirm: warning, run: async () => { await api.delete(path); } });
const pageRows = (pages: BookPage[]): PageRow[] => pages.map(page => ({ id: page.id, title: page.title, detail: `Page ${page.number}`, pageId: page.id }));
// Inline figures use the same typography as the sentence around them.
const figure = (value: number) => createElement("strong", null, value);
const sentence = (...parts: (string | ReturnType<typeof figure>)[]) => createElement("span", null, ...parts);

/** Unfinished books open a single informational page without loading feature data. */
function underDevelopmentBook(details: Pick<BookDefinition, "id" | "title" | "subtitle" | "mark" | "color" | "description">): BookDefinition {
  return {
    ...details,
    load: async () => ({}),
    pages: () => [{ id: "under-development", title: "Still under development", number: "1", kind: "under-development" }],
    view: async () => ({
      eyebrow: details.title,
      description: details.description,
      content: createElement("p", null, "This feature is still under development. Its tools will be available here when it is ready."),
    }),
  };
}

/**
 * Load grades first, then load their classes in parallel. Combine the responses into the
 * data shape used by several principal books.
 */
async function structure(schoolId: number): Promise<BookData> {
  const grades = (await get(`${base(schoolId)}/grades`)).sort((a, b) => Number(a.number) - Number(b.number));
  const classes = (await Promise.all(grades.map(grade => get(`${base(schoolId)}/grades/${grade.id}/classes`)))).flat();
  return { grades, classes };
}

/**
 * Describe the Add/Edit class dialog and save payload. Return the saved class's page ID so
 * the workspace can open it after refreshing.
 */
function classCommand(schoolId: number, data: BookData, grade: RecordItem, cls?: RecordItem): Command {
  return {
    label: cls ? "Edit class" : `Create a class in Grade ${grade.number}`,
    fields: [text("label", "Class label (for example A)", cls ? String(cls.name).replace(/^grade\s*/i, "").replace(new RegExp(`^${grade.number}\\s*`), "") : ""),
      select("classTeacherId", "Class manager", data.people, String(cls?.classTeacherId ?? "")),
      { ...text("description", "Description", String(cls?.description ?? ""), false), maxLength: 200, type: "textarea" }],
    run: async values => {
      const name = `${grade.number}${values.label.trim().toUpperCase()}`;
      if (data.classes.some(item => item.gradeId === grade.id && item.id !== cls?.id && String(item.name).toLowerCase() === name.toLowerCase())) throw new Error("That class already exists in this grade.");
      const path = `${base(schoolId)}/grades/${grade.id}/classes`;
      const payload = { name, classTeacherId: Number(values.classTeacherId) || null, description: values.description.trim() || null };
      const saved = cls ? await api.patch<RecordItem>(`${path}/${cls.id}`, payload) : await api.post<RecordItem>(path, payload);
      return `class-${saved.id}`;
    },
  };
}

/**
 * Describe the staff/learner creation dialog. Convert select values to numeric IDs before
 * sending the appropriate account payload.
 */
function personCommand(schoolId: number, kind: "staff" | "learners", classes: RecordItem[] = [], classId = ""): Command {
  return {
    label: kind === "staff" ? "Add staff member" : "Add learner",
    fields: [...(kind === "staff" ? [text("title", "Title")] : []), text("firstName", "First name"), text("surname", "Surname"), text("identifier", kind === "staff" ? "Staff number" : "Admission number"),
      ...(kind === "learners" ? [{ ...select("classId", "Class", classes.map(item => ({ ...item, name: classLabel(item) })), classId, true) }] : [])],
    run: async values => {
      await api.post(`${base(schoolId)}/${kind === "staff" ? "people" : "learners"}`, { firstName: values.firstName, surname: values.surname,
        ...(kind === "staff" ? { title: values.title, staffNumber: values.identifier, role: "teacher" } : { admissionNumber: values.identifier, classId: Number(values.classId) }) });
    },
  };
}

/**
 * Shelf order comes from this array. Each definition's stable id is the ?book= value; mark
 * is only the printed cover label.
 */
export const BOOKS: BookDefinition[] = [
  {
    /**
     * Grades & Classes: build parent grade pages, child class pages and learner-import
     * grandchildren from saved records.
     */
    id: "grades", title: "Grades & Classes", subtitle: "Your school, organised", mark: "01", color: "#8b413d",
    description: "Browse grades and classes, manage class teachers and subjects, and add learners to their class.",
    load: async schoolId => { const [data, streams, people] = await Promise.all([structure(schoolId), get(`${base(schoolId)}/streams`), get(`${base(schoolId)}/people`)]); return { ...data, streams, people }; },
    pages: data => data.grades.map((grade, index) => ({ id: `grade-${grade.id}`, title: `Grade ${grade.number}`, number: String(index + 1), kind: "grade", entity: grade,
      children: data.classes.filter(cls => cls.gradeId === grade.id).sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true })).map((cls, childIndex) => ({
        id: `class-${cls.id}`, title: classLabel(cls), number: `${index + 1}.${childIndex + 1}`, kind: "class", entity: cls,
        children: [{ id: `import-${cls.id}`, title: "Bulk import learners", number: `${index + 1}.${childIndex + 1}.1`, kind: "import", entity: cls }],
      })),
    })),
    view: async ({ schoolId, data, page, tab }) => {
      const entity = page.entity!;
      if (page.kind === "import") return { description: `Add learners to ${classLabel(entity)}. Review and edit your spreadsheet before saving.`, import: { kind: "learners", classId: String(entity.id) } };
      if (page.kind === "grade") {
        const classes = data.classes.filter(cls => cls.gradeId === entity.id);
        const learnerCount = classes.reduce((sum, cls) => sum + Number(cls.learnerCount ?? 0), 0);
        return { description: sentence(`Grade ${entity.number} has `, figure(classes.length), ` ${classes.length === 1 ? "class" : "classes"} with `, figure(learnerCount), ` ${learnerCount === 1 ? "learner" : "learners"} enrolled.`),
          sections: [{ title: "Classes in this grade", rows: pageRows(page.children ?? []), empty: "No classes yet. Create the first class here.", actions: [classCommand(schoolId, data, entity)] }] };
      }
      const grade = data.grades.find(grade => grade.id === entity.gradeId)!;
      const manager = data.people.find(person => person.id === entity.classTeacherId);
      const path = `${base(schoolId)}/classes/${entity.id}`;
      const subjectsSelected = tab === "subjects";
      const items = await get(`${path}/${subjectsSelected ? "subjects" : "learners"}`);
      const stream = data.streams.find(stream => stream.id === entity.streamId);
      const assignStream: Command = {
        label: "Manage streams", variant:"filled", title:"Class streams and subject split",
        content:createElement(ClassStreamsEditor,{schoolId,classId:entity.id,streams:data.streams.map(row=>({id:row.id,name:String(row.name)}))}),
        run:async (_values,form)=>{
          if(form.get('streamEditorReady')!=='yes')throw new Error('Wait for the class streams to load.');
          const streamIds=form.getAll('streamIds').map(Number);
          const primarySubjectId=Number(form.get('primarySubjectId'));
          const locations=[...form.keys()].filter(key=>key.startsWith('building-')).map(key=>({subjectId:Number(key.slice(9)),building:String(form.get(key)??'').trim(),classroom:String(form.get('classroom-'+key.slice(9))??'').trim()}));
          await api.put(`${base(schoolId)}/classes/${entity.id}/streams`,{streamIds,configuration:primarySubjectId?{primarySubjectId,locations}:null});
        },
      };
      return { guidance: subjectsSelected
          ? { text: stream ? data.streams.filter(row=>((entity.streamIds as number[]|undefined)?.length ? (entity.streamIds as number[]).includes(row.id):row.id===entity.streamId)).map(row=>streamLabel(String(row.name))).join(" + ") : "No stream has been assigned yet. Manage streams to assign subjects to this class." }
          : { text: "To manage subjects in this class, click the Subjects tab." },
        description: manager ? `Class manager: ${nameOf(manager)}` : "No class manager assigned. Use Edit class to choose one.",
        titleActions: [{ ...classCommand(schoolId, data, grade, entity), variant: "filled" },
          { ...remove(classLabel(entity), `${base(schoolId)}/grades/${grade.id}/classes/${entity.id}`, "Only an unused class without learners or recorded history can be deleted. Classes with history must be retained."), label: "Delete class", variant: "outline" }],
        tabs: [{ id: "learners", label: "Learners" }, { id: "subjects", label: "Subjects" }],
        sections: [{ title: subjectsSelected ? "Subjects & teachers" : "Class register", empty: subjectsSelected ? "Assign one or more streams to bring subjects into this master class." : "Your class register is empty. Choose Add learner or Bulk import learners to get started.",
          actions: subjectsSelected ? [assignStream] : [{ ...personCommand(schoolId, "learners", data.classes, String(entity.id)), alternative: { label: "Bulk import learners", pageId: `import-${entity.id}` } }, ...(items.length ? [{ label: "Move learners", title: `Move learners from ${classLabel(entity)}`, variant: "outline" as const, renderContent: (controls: { onSaved: () => Promise<void>; onClose: () => void; setBusy: (busy: boolean) => void }) => createElement(MoveLearners, {
            schoolId, classId: entity.id, sourceName: classLabel(entity), learners: items.map(row=>({id:row.id,firstName:String(row.firstName),surname:String(row.surname),admissionNumber:String(row.admissionNumber)})),
            destinations: data.classes.filter(row=>row.id!==entity.id&&row.gradeId===entity.gradeId&&row.academicYear===entity.academicYear).map(row=>({id:row.id,label:classLabel(row)})), ...controls,
          }) }] : [])],
          rows: items.map(item => ({ id: String(item.id), title: subjectsSelected ? String(item.subjectName) : learnerName(item),
            detail: subjectsSelected ? nameOf(data.people.find(person => person.id === item.personId) ?? { id: 0 }) || "No teacher assigned" : [item.admissionNumber,item.selectedStreamName].filter(Boolean).join(" · "),
            badge: subjectsSelected ? undefined : item.accountSetUp ? "Account active" : "Setup pending",
            actions: subjectsSelected ? [{ label: "Assign teacher", fields: [select("personId", "Teacher", data.people, String(item.personId ?? ""))], run: async values => { await api.patch(`${path}/subjects/${item.id}/teacher`, { personId: Number(values.personId) || null }); } },
              { label: "Curriculum", content: createElement(ClassCurriculum, { schoolId, classId: entity.id, classSubjectId: item.id, subjectName: String(item.subjectName) }) }] : ((entity.streamIds as number[]|undefined)?.length??0)>1 ? [{label:"Reset subject choice",title:`Reset subjects for ${learnerName(item)}`,confirm:"This learner will need to confirm their subject combination again. Existing lesson feedback and homework history will be preserved.",run:async()=>{await api.delete(`${path}/learners/${item.id}/stream-selection`);}}]:[],
          })) }],
      };
    },
  },
  {
    /**
     * Streams: manage subject groupings that determine a class's active subject allocations.
     */
    id: "streams", title: "Streams", subtitle: "Subjects that belong together", mark: "02", color: "#536b58",
    description: "Create subject bundles for your school, then assign them to classes. Changes to a stream do not rewrite existing class teaching records.",
    load: async schoolId => { const [streams, subjects] = await Promise.all([get(`${base(schoolId)}/streams`), get("/subjects")]); return { streams, subjects }; },
    pages: data => [{ id: "my-streams", title: "My Streams", number: "1", kind: "streams", children: data.streams.map((stream, index) => ({ id: `stream-${stream.id}`, title: streamLabel(String(stream.name)), number: `1.${index + 1}`, kind: "stream", entity: stream })) }, { id: "system-streams", title: "System Streams", number: "2", kind: "system-streams" }],
    view: async ({ schoolId, data, page }) => {
      const stream = page.entity;
      const path = `${base(schoolId)}/streams`;
      let createdStream: RecordItem | null = null;
      const addedSubjects = new Set<number>();
      const create: Command = { label: "Create a stream", fields: [text("name", "Stream name"), { name: "subjects", label: "Subjects", type: "subjects", options: optionsOf(data.subjects) }], run: async (values, formData) => {
        if (!createdStream) createdStream = await api.post<RecordItem>(path, { name: values.name });
        else if (createdStream.name !== values.name) { await api.patch(`${path}/${createdStream.id}`, { name: values.name }); createdStream.name = values.name; }
        try { for (const selected of formData.getAll("subjects")) { const subjectId = Number(selected); if (!addedSubjects.has(subjectId)) { await api.post(`${path}/${createdStream.id}/subjects`, { subjectId }); addedSubjects.add(subjectId); } } }
        catch { throw new Error("The stream was created, but some subjects could not be added. Save again to retry the remaining subjects, or close and refresh the book to review the stream."); }
        return `stream-${createdStream.id}`;
      } };
      if (page.kind === "system-streams") return { description: "System stream templates will appear here when they are available from the platform.", sections: [{ title: "System streams", rows: [], empty: "No system stream catalogue is available yet. You can create a school stream from the subject catalogue in My Streams." }] };
      if (!stream) return { description: sentence(`There ${data.streams.length === 1 ? "is " : "are "}`, figure(data.streams.length), ` ${data.streams.length === 1 ? "stream" : "streams"} created for this school. You can create a stream and choose its subjects from `, figure(data.subjects.length), ` available ${data.subjects.length === 1 ? "subject" : "subjects"}.`), sections: [{ title: "Your streams", rows: pageRows(page.children ?? []), empty: "Create your first stream to start grouping subjects.", actions: [create] }] };
      const subjects = await get(`${path}/${stream.id}/subjects`);
      return { description: "Manage the subjects in this stream. Existing class teaching records are preserved when you change this list.",
        sections: [{ title: "Subjects", rows: subjects.map(item => ({ id: String(item.id), title: String(item.subjectName), actions: [remove(String(item.subjectName), `${path}/${stream.id}/subjects/${item.id}`, "Remove this subject from the stream?")] })), empty: "Add subjects from the platform catalogue.",
          actions: [{ label: "Add subject", variant: "filled", fields: [select("subjectId", "Subject", data.subjects.filter(subject => !subjects.some(item => item.subjectId === subject.id)), "", true)], run: async values => { await api.post(`${path}/${stream.id}/subjects`, { subjectId: Number(values.subjectId) }); } }] }],
        titleActions: [{ label: "Rename stream", variant: "filled", fields: [text("name", "Stream name", String(stream.name))], run: async values => { await api.patch(`${path}/${stream.id}`, values); } },
          { ...remove(streamLabel(String(stream.name)), `${path}/${stream.id}`), label: "Delete stream", variant: "outline" }],
      };
    },
  },
  {
    /**
     * Staff register: filters/search change the displayed roster; actions delegate saving to the
     * people API.
     */
    id: "staff", title: "Staff", subtitle: "The people behind the school", mark: "03", color: "#536680",
    description: "Keep your staff register, review account activation and teaching assignments, and import staff from a spreadsheet.",
    load: async schoolId => ({ people: await get(`${base(schoolId)}/people`) }),
    pages: () => [{ id: "staff", title: "Staff register", number: "1", kind: "staff" }, { id: "import-staff", title: "Bulk import staff", number: "2", kind: "import" }],
    view: async ({ schoolId, data, page, tab, isPrincipal }) => {
      if (page.kind === "import") return { description: "Upload a spreadsheet, review the rows, then save your new staff records.", import: { kind: "staff" } };
      const people = data.people.filter(person => tab === "assigned" ? Number(person.assignedChapterCount) > 0 : tab === "unassigned" ? !Number(person.assignedChapterCount) : tab === "pending" ? !person.accountSetUp : tab === "active" ? !!person.accountSetUp : true);
      const activeCount = data.people.filter(person => person.accountSetUp).length;
      return { description: sentence("This school has ", figure(data.people.length), ` staff ${data.people.length === 1 ? "member" : "members"}, of whom `, figure(activeCount), activeCount === 1 ? " has activated their account." : " have activated their accounts."),
        tabs: [{ id: "all", label: "All staff" }, { id: "assigned", label: "Teaching assigned" }, { id: "unassigned", label: "Not assigned" }, { id: "active", label: "Account active" }, { id: "pending", label: "Setup pending" }],
        filterDisplay: "dropdown", searchable: true,
        sections: [{ title: "Staff register", rows: people.map(person => ({ id: String(person.id), title: nameOf(person), detail: `${person.staffNumber} · ${Number(person.assignedChapterCount ?? 0)} assigned chapters`, badge: person.accountSetUp ? "Account active" : "Setup pending", actions:isPrincipal?[{label:"Assign administrative work",title:`Administrative work for ${nameOf(person)}`,content:createElement(AdministrativeWorkEditor,{selected:(person.administrativeWork??[]) as string[]}),run:async(_values,form)=>{await api.put(`${base(schoolId)}/people/${person.id}/administrative-work`,{capabilities:form.getAll('capabilities')});}}]:[] })), empty: "No staff members match this view.", actions: [{ ...personCommand(schoolId, "staff"), alternative: { label: "Bulk import staff", pageId: "import-staff" } }] }] };
    },
  },
  {
    /**
     * Learner register: class choices and roster actions are derived from school records.
     */
    id: "learners", title: "Learners", subtitle: "Every learner accounted for", mark: "04", color: "#96713d",
    description: "Browse learners across your school, check account activation, and add or import learners into a class.",
    load: async schoolId => { const data = await structure(schoolId); return data; },
    pages: data => [{ id: "learners", title: "School register", number: "1", kind: "learners", children: data.classes.map((cls, index) => ({ id: `learners-${cls.id}`, title: classLabel(cls), number: `1.${index + 1}`, kind: "class-learners", entity: cls })) }, { id: "import-learners", title: "Bulk import learners", number: "2", kind: "import" }],
    view: async ({ schoolId, data, page, tab }) => {
      if (page.kind === "import") return { description: "Choose a class and review your spreadsheet before adding learners.", import: { kind: "learners" } };
      const classes = page.entity ? [page.entity] : data.classes;
      const learners: RecordItem[] = (await Promise.all(classes.map(async cls => (await get(`${base(schoolId)}/classes/${cls.id}/learners`)).map(person => ({ ...person, className: classLabel(cls) }))))).flat();
      const activeCount = learners.filter(person => person.accountSetUp).length;
      return { description: sentence(page.entity ? `${classLabel(page.entity)} has ` : "This school has ", figure(learners.length), ` ${learners.length === 1 ? "learner" : "learners"} enrolled, of whom `, figure(activeCount), activeCount === 1 ? " has activated their account." : " have activated their accounts."),
        tabs: [{ id: "all", label: "All learners" }, { id: "pending", label: "Setup pending" }],
        sections: [{ title: "Learner register", rows: learners.filter(person => tab !== "pending" || !person.accountSetUp).map(person => ({ id: String(person.id), title: learnerName(person), detail: `${person.className} · ${person.admissionNumber}`, badge: person.accountSetUp ? "Account active" : "Setup pending" })), empty: "No learners match this view. Add a learner or open Bulk import learners.", actions: [{ ...personCommand(schoolId, "learners", data.classes, String(page.entity?.id ?? "")), alternative: { label: "Bulk import learners", pageId: "import-learners" } }] }] };
    },
  },
  underDevelopmentBook({
    id: "announcements", title: "Announcements", subtitle: "Keep your school in the loop", mark: "05", color: "#786081",
    description: "Announcements will be a place to share school news, reminders and important updates. You will be able to publish messages for everyone, a grade, a class or a stream, and edit or remove announcements as needed.",
  }),
  {
    /**
     * Curriculum browsing reuses the subject/grade library rather than inventing another
     * independent copy.
     */
    id: "curriculum", title: "Curriculum", subtitle: "See the learning journey", mark: "06", color: "#4d7778",
    description: "Explore the curriculum by grade and subject, then view chapters and concepts in each subject.",
    load: async schoolId => {
      const [data, subjects] = await Promise.all([structure(schoolId), get("/subjects")]);
      const streamIds = [...new Set(data.classes.flatMap(cls => (cls.streamIds as number[]|undefined)?.length ? cls.streamIds as number[] : [Number(cls.streamId)]).filter(id => Number.isSafeInteger(id) && id > 0))];
      const streamSubjects = (await Promise.all(streamIds.map(async streamId =>
        (await get(`${base(schoolId)}/streams/${streamId}/subjects`)).map(item => ({ ...item, streamId }))
      ))).flat();
      return { ...data, subjects, streamSubjects };
    },
    pages: data => {
      const subjectsByStream = new Map<number, Set<number>>();
      for (const item of data.streamSubjects) {
        const ids = subjectsByStream.get(Number(item.streamId)) ?? new Set<number>();
        ids.add(Number(item.subjectId));
        subjectsByStream.set(Number(item.streamId), ids);
      }
      const subjectsByGrade = new Map<number, Set<number>>();
      for (const cls of data.classes) {
        const ids = subjectsByGrade.get(Number(cls.gradeId)) ?? new Set<number>();
        for(const streamId of ((cls.streamIds as number[]|undefined)?.length ? cls.streamIds as number[]:[Number(cls.streamId)])) for (const id of subjectsByStream.get(streamId) ?? []) ids.add(id);
        subjectsByGrade.set(Number(cls.gradeId), ids);
      }
      return [...data.grades].sort((a, b) => Number(a.number) - Number(b.number)).map((grade, index) => ({ id: `curriculum-grade-${grade.id}`, title: `Grade ${grade.number}`, number: String(index + 1), kind: "curriculum-grade", entity: grade,
        children: data.subjects.filter(subject => subjectsByGrade.get(grade.id)?.has(subject.id)).map((subject, childIndex) => ({ id: `curriculum-${grade.id}-${subject.id}`, title: String(subject.name), number: `${index + 1}.${childIndex + 1}`, kind: "curriculum-subject", entity: { ...subject, gradeNumber: grade.number } })),
      }));
    },
    view: async ({ page }) => {
      if (page.kind === "curriculum-grade") return { description: `Subjects from streams assigned to Grade ${page.entity!.number} classes.`, sections: [{ title: "Subjects", rows: pageRows(page.children ?? []), empty: "No subjects to show yet. Assign a subject stream to a class in this grade from Grades & Classes." }] };
      const subject = page.entity!;
      const chapters = await get(`/subjects/${subject.id}/grades/${subject.gradeNumber}/chapters`);
      const sections = await Promise.all(chapters.map(async chapter => ({ title: String(chapter.name), rows: (await get(`/chapters/${chapter.id}/concepts`)).map(concept => ({ id: String(concept.id), title: String(concept.name) })), empty: "No concepts in this chapter yet." })));
      return { eyebrow: `Grade ${subject.gradeNumber}`, description: "Chapters and concepts in the curriculum library.", sections: sections.length ? sections : [{ title: "Chapters", rows: [], empty: "No curriculum chapters are available for this subject and grade yet." }] };
    },
  },
];
