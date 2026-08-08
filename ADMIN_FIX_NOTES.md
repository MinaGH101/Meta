# Admin project form fix

The broken generated SQLAdmin project forms were removed.

Use these SQLAdmin sidebar pages:

- Projects → Manage Tarahi projects
- Projects → Manage Nezarat projects
- Projects → Manage Ejra projects
- Projects → Manage Nezarat table

Each project page now uses native server-rendered inputs and includes multiple image upload in the same create/edit form. Existing images can be viewed, set as cover, or deleted from the project edit page. Tarahi categories and Nezarat regions are managed from their corresponding project page.

Validated flows:

- Admin login and dashboard navigation.
- Typing into native project fields in Chromium.
- Creating Tarahi, Nezarat, and Ejra projects.
- Uploading JPG project images from the same form.
- Cover-image assignment and image display through the public API.
- Creating Nezarat table rows.
