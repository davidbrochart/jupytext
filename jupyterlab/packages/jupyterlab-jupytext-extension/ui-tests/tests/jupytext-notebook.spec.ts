import { expect, test } from '@jupyterlab/galata';

// Currently we are enabling only percent and MyST formats in Jupytext menu
// So test for only these cases.
// If we update our test env with more external kernels, we can include them
// here in the formats
const formats = [
  {
    createLabel: 'New Python Text Notebook with Percent Format',
    pairLabel: 'Percent Format',
    extension: '.py',
  },
  {
    createLabel: 'New MyST Markdown Text Notebook',
    pairLabel: 'MyST Markdown',
    extension: '.md',
  },
  // {
  //   createLabel: 'New Python Text Notebook with Light Format',
  //   pairLabel: 'Light Format',
  //   extension: '.py',
  // },
  // {
  //   createLabel: 'New Python Text Notebook with Hydrogen Format',
  //   pairLabel: 'Hydrogen Format',
  //   extension: '.py',
  // },
  // {
  //   createLabel: 'New Python Text Notebook with Nomarker Format',
  //   pairLabel: 'Nomarker Format',
  //   extension: '.py',
  // },
  // {
  //   createLabel: 'New Markdown Text Notebook',
  //   pairLabel: 'Markdown',
  //   extension: '.md',
  // },
];

// Get all possible menuPaths
const createNewMenuPaths = formats.map((format) => {
  return {
    menuPath: `Jupytext>New Text Notebook>${format.createLabel}`,
    extension: format.extension,
  };
});

const pairMenuPaths = formats.map((format) => {
  return {
    menuPath: `Jupytext>Pair Notebook>Pair Notebook with ${format.pairLabel}`,
    extension: format.extension,
  };
});

// Toggle metadata
const toggleMetadataPath = 'Jupytext>Include Metadata';

// Name of notebook file
const fileName = 'notebook.ipynb';

/**
 * Helper function to populate notebook cells and run them
 */
async function populateNotebook(page) {
  await page.notebook.setCell(0, 'raw', 'Just a raw cell');
  await page.notebook.addCell(
    'markdown',
    '## This is **bold** and *italic* [link to jupyter.org!](http://jupyter.org)'
  );
  await page.notebook.runCell(1, true);
  await page.notebook.addCell('code', '2 ** 3');
  await page.notebook.runCell(2, true);
}

test.describe('Jupytext Create Text Notebooks from Menu Tests', () => {
  createNewMenuPaths.forEach((paths) => {
    test(`Open menu item ${paths.menuPath}`, async ({ page }) => {
      // await page.goto();
      // Create new text notebook by clicking menupath item
      await page.menu.clickMenuItem(paths.menuPath);

      // Wait for the kernel dialog and accept it
      await page.waitForSelector('.jp-Dialog');
      await page.click('.jp-Dialog .jp-mod-accept');

      // Populate page
      await populateNotebook(page);
      // Toggle Include Metadata. It is enabled by default.
      // It is to avoid having Jupytext version in metadata in snapshot
      // If we include it, for every version bump we need to update snapshots as
      // version changes which will fail UI tests. Just do not include metadata
      // which will ensure smooth version bumping
      await page.menu.clickMenuItem(toggleMetadataPath);
      // Save notebook
      await page.notebook.save();

      // Try to open saved text notebook with Editor factory
      await page.filebrowser.open(`Untitled${paths.extension}`, 'Editor');

      // Compare text notebook contents
      const imageName = `opened-${paths.menuPath.replace(/>/g, '-')}-text.png`;
      expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
    });
  });
});

test.describe('Jupytext Pair Notebooks from Menu Tests', () => {
  // Before each test start a new notebook and add some cell data
  test.beforeEach(async ({ page }) => {
    await page.notebook.createNew(fileName);
    await populateNotebook(page);
  });

  pairMenuPaths.forEach((paths) => {
    test(`Open menu item ${paths.menuPath}`, async ({ page }) => {
      // Click pairing command
      await page.menu.clickMenuItem(paths.menuPath);
      // Toggle Include Metadata. It is enabled by default.
      // It is to avoid having Jupytext version in metadata in snapshot
      // If we include it, for every version bump we need to update snapshots as
      // version changes which will fail UI tests. Just do not include metadata
      // which will ensure smooth version bumping
      await page.menu.clickMenuItem(toggleMetadataPath);
      // Wait until we save notebook. Once we save it, paired file appears
      await page.notebook.save();
      // Try to open paired file
      await page.filebrowser.open(fileName.replace('.ipynb', paths.extension));

      const imageName = `paired-jupytext-${paths.menuPath.replace(
        />/g,
        '-'
      )}.png`;
      expect(await page.screenshot()).toMatchSnapshot(imageName.toLowerCase());
    });
  });
});