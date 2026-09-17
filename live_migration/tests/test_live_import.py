from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "import_live_schedule.py"
SPEC = importlib.util.spec_from_file_location("import_live_schedule", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class LiveImportTests(unittest.TestCase):
    def test_delivery_headers_remain_distinct(self) -> None:
        self.assertEqual(MODULE.normalized_header("DELIVERY DATE "), "DELIVERY DATE REQUESTED")
        self.assertEqual(MODULE.normalized_header("DELIVERY DATE"), "DELIVERY DATE ACTUAL")

    def test_final_four_lookup(self) -> None:
        jobcard = MODULE.normalize_jobcard("ITG-0326-0523 online proofing")
        self.assertEqual(jobcard, "ITG-0326-0523")
        self.assertEqual(MODULE.last_four(jobcard), "0523")

    def test_large_drop_is_rejected(self) -> None:
        snapshot = {"valid_rows": [object()] * 400}
        with self.assertRaises(ValueError):
            MODULE.validate_snapshot(snapshot, previous_count=1000, minimum=1, max_drop=50)


if __name__ == "__main__":
    unittest.main()
