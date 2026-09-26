import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { supabase } from '@/lib/supabase';
import { STORE_CONFIG } from '@/config/store.config';

export async function GET() {
  try {
    const { data: categories } = await supabase.from('Category').select('name');
    const categoryNames = categories?.map(c => c.name) || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Products');

    // Define columns
    const columns = [
      { header: 'Title*', key: 'title', width: 25 },
      { header: 'SKU*', key: 'sku', width: 15 },
      { header: 'Category 1 (Main)*', key: 'category1', width: 20 },
      { header: 'Category 2 (Sub)*', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Image URL 1*', key: 'image_url_1', width: 40 },
      { header: 'Image URL 2', key: 'image_url_2', width: 40 },
      { header: 'Image URL 3', key: 'image_url_3', width: 40 },
      { header: 'Image URL 4', key: 'image_url_4', width: 40 },
      { header: 'Image URL 5', key: 'image_url_5', width: 40 },
    ];

    // Add custom fields
    STORE_CONFIG.customFields.forEach(field => {
      columns.push({ header: `Attr: ${field.label}`, key: `attr_${field.key}`, width: 20 });
    });

    sheet.columns = columns;

    // Fetch field options for dropdowns
    const { data: fieldOptions } = await supabase.from('FieldOption').select('*');
    
    // Create a hidden sheet to store validation lists if they are long
    const dropdownSheet = workbook.addWorksheet('DropdownLists', { state: 'hidden' });
    
    let dropdownColIndex = 1;
    
    // Add Category list to hidden sheet
    if (categoryNames.length > 0) {
      dropdownSheet.getColumn(dropdownColIndex).values = categoryNames;
      const categoryCol = dropdownSheet.getColumn(dropdownColIndex).letter;
      const range = `DropdownLists!$${categoryCol}$1:$${categoryCol}$${categoryNames.length}`;
      
      // Apply validation to Category column (C) for 1000 rows
      for (let i = 2; i <= 1000; i++) {
        sheet.getCell(`C${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [range],
          showErrorMessage: true,
          errorTitle: 'Invalid Category',
          error: 'Please select a category from the dropdown.'
        };
      }
      dropdownColIndex++;
    }

    // Add custom field lists
    STORE_CONFIG.customFields.forEach((field, index) => {
      if (field.type === 'select') {
        const options = fieldOptions?.filter((o: any) => o.fieldKey === field.key).map((o: any) => o.value) || [];
        if (options.length > 0) {
          dropdownSheet.getColumn(dropdownColIndex).values = options;
          const colLetter = dropdownSheet.getColumn(dropdownColIndex).letter;
          const range = `DropdownLists!$${colLetter}$1:$${colLetter}$${options.length}`;
          
          const mainSheetCol = sheet.getColumn(11 + index + 1).letter;
          
          for (let i = 2; i <= 1000; i++) {
            sheet.getCell(`${mainSheetCol}${i}`).dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: [range],
              showErrorMessage: true,
              errorTitle: 'Invalid Option',
              error: 'Please select a valid option from the dropdown.'
            };
          }
          dropdownColIndex++;
        }
      } else if (field.type === 'boolean') {
        const mainSheetCol = sheet.getColumn(11 + index + 1).letter;
        for (let i = 2; i <= 1000; i++) {
          sheet.getCell(`${mainSheetCol}${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"Yes,No"'],
            showErrorMessage: true,
            errorTitle: 'Invalid Input',
            error: 'Please select Yes or No.'
          };
          // Default to Yes for boolean fields like "In Stock" if they wish, but blank is fine.
        }
      }
    });

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    // Add default row if any default values exist
    const defaultRow: any = {};
    STORE_CONFIG.customFields.forEach(field => {
      if (field.defaultValue !== undefined) {
        const headerName = `Attr: ${field.label}`;
        const col = columns.find(c => c.header === headerName);
        if (col && col.key) defaultRow[col.key] = field.type === 'boolean' ? (field.defaultValue ? 'Yes' : 'No') : field.defaultValue;
      }
    });
    if (Object.keys(defaultRow).length > 0) {
      sheet.addRow(defaultRow);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="bulk_upload_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
