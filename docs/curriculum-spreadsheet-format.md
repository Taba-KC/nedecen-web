# Curriculum spreadsheet format

Use one worksheet per subject and grade, and one row per concept. In Curriculum manager, select the subject and grade before uploading. Row 1 must contain these headers in this order:

| Columns | Headers | Contents |
| --- | --- | --- |
| A | Chapter | Repeat the chapter name on every concept row. |
| B | Topic | Repeat the topic name on every concept row. |
| C | Concept | One concept name. |
| D–H | Prerequisite 1, Prerequisite 2, Prerequisite 3, Prerequisite 4, Prerequisite 5 | One essential prior skill per cell. Leave unused cells blank. |
| I–M | Learning outcome 1, Learning outcome 2, Learning outcome 3, Learning outcome 4, Learning outcome 5 | One observable outcome per cell. Leave unused cells blank. |

Prerequisites describe simple skills needed **before** learning the concept, for example: “Be able to identify opposite and adjacent sides of a right-angled triangle” or “Be able to use inverse tangent in degree mode.” Do not restate the new concept as its own prerequisite.

Learning outcomes describe what the learner can do **afterwards**, for example: “Can you calculate the reference angle from two perpendicular components?” Use specific actions such as identify, calculate, draw or explain.

Use zero to five prerequisites and zero to five outcomes. Five is a maximum, not a target. Keep each cell under 1,000 characters. Use plain text rather than formulas. Blank rows are ignored. The original chapter/topic-column spreadsheet format still works, but it cannot carry these additional fields.

The downloadable [example workbook](/templates/curriculum-template.xlsx) contains two example concept rows. Replace them with your curriculum; do not leave example rows in a real upload unless they belong there. The importer preserves the order in which chapters, topics and concepts first appear.

Upload → review → Save curriculum. To edit later, load the saved curriculum, expand **Prerequisites and learning outcomes** beneath a concept, change its fields, and save again. Names, chapter/topic order, prerequisites and outcomes remain editable. Clearing all five fields removes that list. These are shared records for the subject and grade, so all classes use the same curriculum guidance. Planned lessons use current guidance; confirmed lessons retain the guidance recorded when teaching was confirmed.

Uploading a replacement workbook is a replacement workflow, not an update by concept ID. Use the saved curriculum editor to make ordinary amendments while retaining existing concept identities and lesson links.

For vector components, state where the angle is measured from. The existing `R_y = R cos(theta)` concept uses an angle measured from the vertical; if the angle is measured from the horizontal, the vertical component uses sine. The populated prerequisites and outcomes make this distinction explicit.
