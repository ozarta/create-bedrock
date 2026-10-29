"""Additional archive checks; primary pure-domain tests run with Node."""
import importlib.util
from pathlib import Path
import io
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('package_addon', Path(__file__).resolve().parents[1] / 'tools/package_addon.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ArchiveTests(unittest.TestCase):
    def test_archive_is_independent_of_input_order(self):
        entries = [('b/one.txt', b'one'), ('a/two.txt', b'two')]
        self.assertEqual(module.archive(entries), module.archive(list(reversed(entries))))

    def test_archive_contains_exact_bytes_and_fixed_metadata(self):
        with zipfile.ZipFile(io.BytesIO(module.archive([('manifest.json', b'{}')]))) as archive:
            self.assertEqual(archive.read('manifest.json'), b'{}')
            self.assertEqual(archive.getinfo('manifest.json').date_time, (2026, 1, 1, 0, 0, 0))
            self.assertIsNone(archive.testzip())


if __name__ == '__main__': unittest.main()
