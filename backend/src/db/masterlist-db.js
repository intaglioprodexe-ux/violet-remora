const PRODUCT_COLUMNS = `
  id,
  product_code_raw,
  product_code,
  product_code_normalized,
  product_status,
  date_created,
  supplied_by,
  route_id,
  category,
  application,
  product_layers,
  product_category,
  customer_name,
  product_name,
  label_width_mm,
  label_height_mm,
  ups,
  colour_quantity,
  slitting_size,
  roll_length_m,
  print_material,
  print_film_width,
  print_film_thickness_um,
  print_film_density,
  barrier1_film_width,
  barrier1_thickness_um,
  barrier1_density,
  barrier2_film_width,
  barrier2_thickness_um,
  barrier2_density,
  sealant_film_width,
  sealant_thickness_um,
  sealant_density,
  l1p1t1,
  l2p2t2,
  l3p3t3,
  l4p4t4,
  lpt,
  m2r,
  m2p,
  pcs_kg,
  m_kg,
  jm_kg,
  pt_kg,
  process_51_printing,
  process_52_laminating,
  process_53_slitting,
  process_54_seaming,
  process_55_inspecting,
  process_56_cutting,
  process_57_packing,
  calculation_warnings_json,
  imported_at
`;

function searchMasterlistItems(database, productCode, limit = 25) {
  const search = String(productCode || "").trim();
  const pattern = `%${search}%`;

  if (!search) {
    return database
      .prepare(
        `SELECT ${PRODUCT_COLUMNS}
         FROM master_items
         ORDER BY product_code_normalized, id
         LIMIT ?`
      )
      .all(limit);
  }

  return database
    .prepare(
      `SELECT ${PRODUCT_COLUMNS}
       FROM master_items
       WHERE product_code_normalized LIKE ?
          OR product_code LIKE ?
          OR product_code_raw LIKE ?
       ORDER BY
         CASE
           WHEN product_code_normalized = ? THEN 0
           WHEN product_code = ? THEN 1
           WHEN product_code_raw = ? THEN 2
           ELSE 3
         END,
         product_code_normalized,
         id
       LIMIT ?`
    )
    .all(pattern, pattern, pattern, search, search, search, limit);
}

function countMasterlistItems(database) {
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM master_items")
    .get();

  return Number(row.count);
}

module.exports = {
  countMasterlistItems,
  searchMasterlistItems
};
