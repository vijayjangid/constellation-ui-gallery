import { getKindFromMimeType, DateTimeDisplay } from '@pega/cosmos-react-core';

export const canPreviewFile = (type: string) => {
  return type === 'image' || type === 'pdf';
};

const binaryToArrayBuffer = (binaryString: string) => {
  const bytes = new Uint8Array(binaryString.length);
  return bytes.map((byte, i) => binaryString.charCodeAt(i));
};

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = window.atob(base64);
  return binaryToArrayBuffer(binaryString);
};

const isContentBinary = (headers: any) => {
  return headers && headers['content-transfer-encoding'] === 'binary';
};

const isContentBase64 = (headers: any) => {
  return headers && headers['content-transfer-encoding'] === 'base64';
};

export const downloadBlob = (arrayBuf: any, name: string, mimeType: string) => {
  const blob = new Blob([arrayBuf], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = name;
  document.body.appendChild(link);
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
  );
  document.body.removeChild(link);
};

const fileDownload = (data: string, attachment: any, headers: any) => {
  const name = attachment.extension
    ? `${attachment.name}.${attachment.extension}`
    : attachment.fileName;
  downloadBlob(isContentBase64(headers) ? atob(data) : data, name, attachment.mimeType);
};

/* Main utility function do handle what to do when clicking on an attachment
    - if image or pdf, will open the file in a new tab
    - if URL, will open the link in a new tab
    - Otherwise, will download the file
 */
export const downloadFile = (attachment: any, getPConnect: any, setImages?: any) => {
  const kind = getKindFromMimeType(attachment.mimeType);
  (window as any).PCore.getAttachmentUtils()
    .downloadAttachment(attachment.ID, getPConnect().getContextName(), attachment.responseType)
    .then((content: any) => {
      if (canPreviewFile(kind)) {
        let arrayBuf: Uint8Array | BlobPart;
        if (isContentBinary(content.headers)) arrayBuf = content.data;
        else arrayBuf = base64ToArrayBuffer(content.data);
        const blob = new Blob([arrayBuf], { type: attachment.mimeType });
        const fileURL = URL.createObjectURL(blob);
        if (setImages) {
          const name = attachment.extension
            ? `${attachment.name}.${attachment.extension}`
            : attachment.fileName;
          const metadata: Array<any> = [];
          metadata.push(attachment.createdByName);
          metadata.push(<DateTimeDisplay value={new Date(attachment.createTime)} variant='date' />);
          setImages([
            {
              id: attachment.ID,
              name,
              description: attachment.categoryName,
              mimeType: attachment.mimeType,
              blob,
              src: fileURL,
              metadata
            }
          ]);
        } else {
          window.open(fileURL, '_blank');
        }
      } else if (attachment.type === 'URL') {
        let { data } = content;
        if (!/^(http|https):\/\//.test(data)) {
          data = `//${data}`;
        }
        window.open(content.data, '_blank');
      } else {
        fileDownload(content.data, attachment, content.headers);
      }
    });
};
