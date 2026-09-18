from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "import_masterlist.py"
SPEC = importlib.util.spec_from_file_location("import_masterlist", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class CalculationTests(unittest.TestCase):
    def base_row(self):
        return {
            "RouteID": "SHRINK PIECE", "ProductCategory": "PRINTED",
            "Print_Material": "PVC - BLOW", "Print_FilmThickness_µm": 40,
            "PrintFIlm_Density": 1_300_000, "Barrier1_Thickness_µm": "-",
            "Barrier1_Density": "-", "Barrier2_Thickness_µm": None,
            "Barrier2_Density": None, "Sealant_Thickness_µm": None,
            "Sealant_Density": None, "SlittingSize": 200, "RollLengthM": 1000,
            "LabelWidth (MM)": 100, "LabelHeight (MM)": 150, "UPS": 2,
            "Print_FilmWidth": 430, "Barrier1_FilmWidth": "-",
            "Barrier2_FIlmWidth": "-", "Sealant_FilmWidth": "-",
            "ColourQuantity": "8C",
        }

    def test_pvc_thickness_and_colour_corrections(self):
        item = MODULE.calculate_item(self.base_row())
        self.assertEqual(item["print_film_thickness_um"], 38.0)
        self.assertEqual(item["colour_quantity"], 8)

    def test_route_flags(self):
        item = MODULE.calculate_item(self.base_row())
        self.assertEqual(item["process_51_printing"], 1)
        self.assertEqual(item["process_54_seaming"], 1)
        self.assertEqual(item["process_56_cutting"], 1)
        self.assertEqual(item["process_52_laminating"], 0)

    def test_invalid_optional_layers_become_zero(self):
        item = MODULE.calculate_item(self.base_row())
        self.assertEqual(item["l2p2t2"], 0.0)
        self.assertEqual(item["l3p3t3"], 0.0)
        self.assertEqual(item["l4p4t4"], 0.0)


if __name__ == "__main__":
    unittest.main()
