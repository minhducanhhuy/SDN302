#!/usr/bin/env node
/**
 * ============================================================================
 * AUTO MONGOOSE MODEL GENERATOR FROM JSON DATA FILES
 * ============================================================================
 * Công cụ tự động tạo Mongoose Model từ các file .json (đặc biệt hỗ trợ MongoDB
 * Extended JSON như $oid, $date, mảng subdocument, tự động suy luận ref, v.v.)
 *
 * Không yêu cầu cài đặt thêm bất kỳ thư viện ngoài nào (dùng sẵn fs, path của Node.js).
 *
 * Cách sử dụng:
 *   node generate-models.js [thư_mục_chứa_json] [thư_mục_xuất_model]
 *
 * Ví dụ:
 *   node generate-models.js ./SDN302_given ./resource/model
 *   node generate-models.js ./data.json ./models
 *   node generate-models.js (tự động quét SDN302_given hoặc thư mục hiện tại)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Quy tắc chuyển danh từ số nhiều sang số ít (cho tên Model)
function singularize(name) {
  let lower = name.toLowerCase();
  if (lower.endsWith('classes')) return 'Class';
  if (lower.endsWith('attendances')) return 'Attendance';
  if (lower.endsWith('categories')) return 'Category';
  if (lower.endsWith('ies')) return capitalize(lower.slice(0, -3) + 'y');
  if (lower.endsWith('ses')) return capitalize(lower.slice(0, -2));
  if (lower.endsWith('s') && !lower.endsWith('ss')) return capitalize(lower.slice(0, -1));
  return capitalize(name);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelCase(str) {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Phân tích kiểu dữ liệu từ giá trị JSON
function inferType(val, fieldName = '', knownModels = {}) {
  if (val === null || val === undefined) {
    return { type: 'mongoose.Schema.Types.Mixed' };
  }

  // MongoDB Extended JSON: $oid
  if (typeof val === 'object' && val !== null && val.$oid) {
    const ref = inferRef(fieldName, knownModels);
    if (ref) {
      return { type: 'mongoose.Schema.Types.ObjectId', ref };
    }
    return { type: 'mongoose.Schema.Types.ObjectId' };
  }

  // MongoDB Extended JSON: $date
  if (typeof val === 'object' && val !== null && (val.$date !== undefined)) {
    return { type: 'Date' };
  }

  // Chuỗi ISO Date
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}(T|\b)/.test(val) && !isNaN(Date.parse(val))) {
    return { type: 'Date' };
  }

  // Chuỗi ObjectId 24 ký tự hex nếu tên trường kết thúc bằng 'Id'
  if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val) && (fieldName.endsWith('Id') || fieldName.endsWith('_id'))) {
    const ref = inferRef(fieldName, knownModels);
    if (ref) {
      return { type: 'mongoose.Schema.Types.ObjectId', ref };
    }
    return { type: 'mongoose.Schema.Types.ObjectId' };
  }

  // Mảng
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return { isArray: true, inner: { type: 'mongoose.Schema.Types.Mixed' } };
    }
    // Lấy mẫu phần tử đầu tiên
    const firstElem = val[0];
    if (typeof firstElem === 'object' && firstElem !== null && !firstElem.$oid && !firstElem.$date) {
      // Mảng các subdocument
      const subSchema = {};
      // Hợp nhất thuộc tính của các phần tử mẫu
      for (const item of val.slice(0, 5)) {
        if (typeof item === 'object' && item !== null) {
          for (const k of Object.keys(item)) {
            if (k === '_id') continue;
            if (!subSchema[k]) {
              subSchema[k] = inferType(item[k], k, knownModels);
            }
          }
        }
      }
      return { isArray: true, isSubdocument: true, subSchema };
    } else {
      const innerType = inferType(firstElem, fieldName.replace(/s$/i, ''), knownModels);
      return { isArray: true, inner: innerType };
    }
  }

  // Object con thông thường
  if (typeof val === 'object' && val !== null) {
    const subSchema = {};
    for (const k of Object.keys(val)) {
      if (k === '_id') continue;
      subSchema[k] = inferType(val[k], k, knownModels);
    }
    return { isObject: true, subSchema };
  }

  // Kiểu nguyên thủy
  if (typeof val === 'number') {
    return { type: 'Number' };
  }
  if (typeof val === 'boolean') {
    return { type: 'Boolean' };
  }
  return { type: 'String' };
}

// Suy luận ref cho ObjectId dựa vào tên trường (ví dụ: studentId -> Student, subjectId -> Subject)
function inferRef(fieldName, knownModels = {}) {
  let baseName = fieldName.replace(/Id$/i, '').replace(/_id$/i, '');
  if (!baseName) return null;

  // Thử khớp trực tiếp với danh sách model đã nhận diện
  const capitalized = capitalize(baseName);
  for (const modelName of Object.values(knownModels)) {
    if (modelName.toLowerCase() === capitalized.toLowerCase()) {
      return modelName;
    }
  }
  return capitalized;
}

// Định dạng Schema ra mã nguồn JS
function formatSchemaFields(schemaObj, indentLevel = 1) {
  const indent = '  '.repeat(indentLevel);
  const lines = [];

  for (const [key, prop] of Object.entries(schemaObj)) {
    if (prop.isArray) {
      if (prop.isSubdocument) {
        lines.push(`${indent}${key}: [{`);
        lines.push(`${indent}  _id: false,`);
        lines.push(formatSchemaFields(prop.subSchema, indentLevel + 1));
        lines.push(`${indent}}],`);
      } else {
        let typeStr = prop.inner.type;
        if (prop.inner.ref) {
          lines.push(`${indent}${key}: [{ type: ${typeStr}, ref: '${prop.inner.ref}' }],`);
        } else {
          lines.push(`${indent}${key}: [{ type: ${typeStr} }],`);
        }
      }
    } else if (prop.isObject) {
      lines.push(`${indent}${key}: {`);
      lines.push(formatSchemaFields(prop.subSchema, indentLevel + 1));
      lines.push(`${indent}},`);
    } else {
      const parts = [`type: ${prop.type}`];
      if (prop.ref) {
        parts.push(`ref: '${prop.ref}'`);
      }
      parts.push('required: true');
      lines.push(`${indent}${key}: { ${parts.join(', ')} },`);
    }
  }

  return lines.join('\n');
}

// Tạo Model từ 1 file JSON
function processJsonFile(filePath, knownModels = {}) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error(`[!] Bỏ qua ${filePath}: Không phải file JSON hợp lệ.`);
    return null;
  }

  const baseFileName = path.basename(filePath, path.extname(filePath));
  const modelName = singularize(baseFileName);
  const collectionName = baseFileName.toLowerCase();
  const schemaVarName = `${camelCase(modelName)}Schema`;

  // Hợp nhất các field từ tối đa 10 document mẫu
  const sampleDocs = Array.isArray(data) ? data.slice(0, 10) : [data];
  const fields = {};

  for (const doc of sampleDocs) {
    if (typeof doc !== 'object' || doc === null) continue;
    for (const key of Object.keys(doc)) {
      if (key === '_id') continue;
      if (!fields[key]) {
        fields[key] = inferType(doc[key], key, knownModels);
      }
    }
  }

  const schemaContent = formatSchemaFields(fields, 1);

  const code = `const mongoose = require('mongoose');

const ${schemaVarName} = new mongoose.Schema({
${schemaContent}
}, {
  timestamps: false,
  versionKey: false
});

module.exports = mongoose.model('${modelName}', ${schemaVarName}, '${collectionName}');
`;

  return {
    modelName,
    collectionName,
    fileName: `${modelName}.js`,
    code
  };
}

// Hàm thực thi chính
function main() {
  const args = process.argv.slice(2);
  let inputPath = args[0];
  let outputPath = args[1];

  console.log('==================================================');
  console.log('   TOOL TỰ ĐỘNG SINH MONGOOSE MODEL TỪ FILE JSON  ');
  console.log('==================================================');

  // Tự động tìm thư mục chứa JSON nếu không truyền đối số
  if (!inputPath) {
    const candidates = ['./SDN302_given', './data', './DB', './given', '.'];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        const hasJson = fs.readdirSync(c).some(f => f.endsWith('.json') && f !== 'package.json' && f !== 'package-lock.json');
        if (hasJson) {
          inputPath = c;
          break;
        }
      }
    }
    if (!inputPath) inputPath = '.';
  }

  // Tự động chọn thư mục xuất
  if (!outputPath) {
    const outCandidates = ['./resource/model', './resource/models', './models', './model'];
    for (const c of outCandidates) {
      if (fs.existsSync(c)) {
        outputPath = c;
        break;
      }
    }
    if (!outputPath) outputPath = './models';
  }

  console.log(`- Thư mục nguồn (JSON):  ${path.resolve(inputPath)}`);
  console.log(`- Thư mục đích (Model):  ${path.resolve(outputPath)}`);
  console.log('--------------------------------------------------');

  // Đảm bảo thư mục xuất tồn tại
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Quét danh sách file JSON
  let jsonFiles = [];
  if (fs.statSync(inputPath).isDirectory()) {
    const allFiles = fs.readdirSync(inputPath);
    jsonFiles = allFiles
      .filter(f => f.endsWith('.json') && f !== 'package.json' && f !== 'package-lock.json')
      .map(f => path.join(inputPath, f));
  } else if (inputPath.endsWith('.json')) {
    jsonFiles = [inputPath];
  }

  if (jsonFiles.length === 0) {
    console.log('[!] Không tìm thấy file .json nào để xử lý.');
    return;
  }

  // Bước 1: Thu thập tên các Model tiềm năng để ánh xạ ref
  const knownModels = {};
  for (const f of jsonFiles) {
    const baseName = path.basename(f, path.extname(f));
    knownModels[baseName] = singularize(baseName);
  }

  // Bước 2: Tạo code model cho từng file
  let generatedCount = 0;
  for (const f of jsonFiles) {
    const res = processJsonFile(f, knownModels);
    if (res) {
      const outFilePath = path.join(outputPath, res.fileName);
      fs.writeFileSync(outFilePath, res.code, 'utf-8');
      console.log(`[+] Đã tạo Model: ${res.fileName} (Collection: '${res.collectionName}')`);
      generatedCount++;
    }
  }

  console.log('--------------------------------------------------');
  console.log(`[OK] Hoàn tất! Đã tự động tạo thành công ${generatedCount} file model.`);
  console.log(`[OK] Các file nằm tại: ${path.resolve(outputPath)}`);
  console.log('==================================================');
}

main();
