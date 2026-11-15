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
      { header: 'Category*', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Available Sizes', key: 'sizes', width: 22 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Materials Detail', key: 'materials_detail', width: 30 },
      { header: 'Image URL 1*', key: 'image_url_1', width: 40 },
      { header: 'Image URL 2', key: 'image_url_2', width: 40 },
      { header: 'Image URL 3', key: 'image_url_3', width: 40 },
      { header: 'Image URL 4', key: 'image_url_4', width: 40 },
      { header: 'Image URL 5', key: 'image_url_5', width: 40 },
    ];

    const baseColsCount = columns.length; // 11

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
      const mainColNum = baseColsCount + index + 1;
      const mainSheetCol = sheet.getColumn(mainColNum).letter;

      if (field.type === 'select') {
        const options = fieldOptions?.filter((o: any) => o.fieldKey === field.key).map((o: any) => o.value) || field.options || [];
        if (options.length > 0) {
          dropdownSheet.getColumn(dropdownColIndex).values = options;
          const colLetter = dropdownSheet.getColumn(dropdownColIndex).letter;
          const range = `DropdownLists!$${colLetter}$1:$${colLetter}$${options.length}`;
          
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
        for (let i = 2; i <= 1000; i++) {
          sheet.getCell(`${mainSheetCol}${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"Yes,No"'],
            showErrorMessage: true,
            errorTitle: 'Invalid Input',
            error: 'Please select Yes or No.'
          };
        }
      }
    });

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    
    // Add default sample row
    const defaultRow: any = {
      title: 'Bridal Kundan Necklace Set',
      sku: 'RC-101',
      category: categoryNames[0] || 'Necklace Set',
      price: 1450,
      sizes: '2.4, 2.6, 2.8',
      description: 'Handcrafted antique gold finish necklace with matching earrings.',
      materials_detail: 'High-grade copper brass alloy with micro gold plating, AAA cubic zirconia and simulated pearls.',
    };

    STORE_CONFIG.customFields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaultRow[`attr_${field.key}`] = field.type === 'boolean' ? (field.defaultValue ? 'Yes' : 'No') : field.defaultValue;
      }
    });
    
    sheet.addRow(defaultRow);

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
