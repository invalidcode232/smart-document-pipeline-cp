export const DATA_TYPES = {
  PDF: 'PDF',
  IMAGE: 'IMAGE',
  TEXT: 'TEXT',
  DOCUMENT: 'DOCUMENT',
  EMAIL_ADDRESS: 'EMAIL_ADDRESS',
}

export const NODE_TYPES = {
  fileUpload: {
    label: 'File Upload',
    inputs: [],
    outputs: [DATA_TYPES.PDF, DATA_TYPES.IMAGE],
  },
  ocr: {
    label: 'OCR',
    inputs: [DATA_TYPES.PDF, DATA_TYPES.IMAGE],
    outputs: [DATA_TYPES.TEXT],
  },
  summarize: {
    label: 'Summarize',
    inputs: [DATA_TYPES.TEXT],
    outputs: [DATA_TYPES.TEXT],
  },
  imageResize: {
    label: 'Image Resize',
    inputs: [DATA_TYPES.IMAGE],
    outputs: [DATA_TYPES.IMAGE],
  },
  textCorrection: {
    label: 'Text Correction',
    inputs: [DATA_TYPES.TEXT],
    outputs: [DATA_TYPES.TEXT],
    flags: { isTextCorrection: true },
  },
  humanReview: {
    label: 'Human Review',
    inputs: [DATA_TYPES.TEXT],
    outputs: [DATA_TYPES.TEXT],
    flags: { isHumanReview: true },
  },
  documentMerger: {
    label: 'Document Merger',
    inputs: [DATA_TYPES.DOCUMENT, DATA_TYPES.PDF, DATA_TYPES.TEXT],
    outputs: [DATA_TYPES.DOCUMENT],
    flags: { isDocumentMerger: true },
  },
  email: {
    label: 'Email',
    inputs: [DATA_TYPES.DOCUMENT, DATA_TYPES.TEXT],
    outputs: [DATA_TYPES.EMAIL_ADDRESS],
  },
}
