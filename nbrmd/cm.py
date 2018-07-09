import notebook.transutils
from notebook.services.contents.filemanager import FileContentsManager
from .hooks import update_selected_formats

import os
import nbrmd
import nbformat
import mock


def _nbrmd_writes(ext):
    def _writes(nb, version=nbformat.NO_CONVERT, **kwargs):
        return nbrmd.writes(nb, version=version, ext=ext, **kwargs)

    return _writes


def _nbrmd_reads(ext):
    def _reads(s, as_version, **kwargs):
        return nbrmd.reads(s, as_version, ext=ext, **kwargs)

    return _reads


class RmdFileContentsManager(FileContentsManager):
    """
    A FileContentsManager Class that reads and stores notebooks to classical
    Jupyter notebooks (.ipynb), or in R Markdown (.Rmd), plain markdown
    (.md), R scripts (.R) or python scripts (.py)
    """
    nb_extensions = [ext for ext in nbrmd.notebook_extensions if
                     ext != '.ipynb']

    def all_nb_extensions(self):
        return ['.ipynb'] + self.nb_extensions

    def __init__(self, **kwargs):
        self.pre_save_hook = update_selected_formats
        super(RmdFileContentsManager, self).__init__(**kwargs)

    def _read_notebook(self, os_path, as_version=4):
        """Read a notebook from an os path."""
        file, ext = os.path.splitext(os_path)
        if ext in self.nb_extensions:
            with mock.patch('nbformat.reads', _nbrmd_reads(ext)):
                return super(RmdFileContentsManager, self) \
                    ._read_notebook(os_path, as_version)
        else:
            return super(RmdFileContentsManager, self) \
                ._read_notebook(os_path, as_version)

    def _save_notebook(self, os_path, nb):
        """Save a notebook to an os_path."""
        file, ext = os.path.splitext(os_path)
        if ext in self.nb_extensions:
            with mock.patch('nbformat.writes', _nbrmd_writes(ext)):
                return super(RmdFileContentsManager, self) \
                    ._save_notebook(os_path, nb)
        else:
            return super(RmdFileContentsManager, self) \
                ._save_notebook(os_path, nb)

    def get(self, path, content=True, type=None, format=None):
        """ Takes a path for an entity and returns its model"""
        path = path.strip('/')

        if self.exists(path) and \
                (type == 'notebook' or
                 (type is None and
                  any([path.endswith(ext)
                       for ext in self.all_nb_extensions()]))):
            return self._notebook_model(path, content=content)
        else:
            return super(RmdFileContentsManager, self) \
                .get(path, content, type, format)

    def rename_file(self, old_path, new_path):
        old_file, org_ext = os.path.splitext(old_path)
        new_file, new_ext = os.path.splitext(new_path)
        if org_ext in self.all_nb_extensions() and org_ext == new_ext:
            for ext in self.all_nb_extensions():
                if self.file_exists(old_file + ext):
                    super(RmdFileContentsManager, self) \
                        .rename_file(old_file + ext, new_file + ext)
        else:
            super(RmdFileContentsManager, self).rename_file(old_path, new_path)
