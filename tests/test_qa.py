"""The QA parser must reject ambiguous data that permissive JSON parsers accept."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
spec=importlib.util.spec_from_file_location('qa_static',Path(__file__).resolve().parents[1]/'tools/qa-static.py')
qa=importlib.util.module_from_spec(spec);spec.loader.exec_module(qa)
class StrictJsonTests(unittest.TestCase):
    def test_duplicate_keys_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'bad.json';path.write_text('{"value":1,"value":2}')
            with self.assertRaisesRegex(ValueError,'duplicada'):qa.strict(path)
    def test_nonfinite_numbers_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'bad.json';path.write_text('{"value":NaN}')
            with self.assertRaisesRegex(ValueError,'no finito'):qa.strict(path)
