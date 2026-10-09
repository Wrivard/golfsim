// Shared mapping: cropped slide coordinates -> printable Letter landscape.
// Keep the confidential access overlay aligned with the exported guide.
export const letter={width:792,height:612,margin:18};
export const canvas={width:1920,height:1080};
export const crop={x:88,y:52,width:1744,height:1016};
export const printScale=Math.min(
 (letter.width-2*letter.margin)/crop.width,
 (letter.height-2*letter.margin)/crop.height,
);
const offsetX=(letter.width-crop.width*printScale)/2-crop.x*printScale;
const offsetY=(letter.height-crop.height*printScale)/2-(canvas.height-crop.y-crop.height)*printScale;
export function printBox(x,y,width,height){
 return {x:offsetX+x*printScale,y:offsetY+(canvas.height-y-height)*printScale,width:width*printScale,height:height*printScale};
}
export function pdfCrop(page){
 const sx=page.getWidth()/canvas.width,sy=page.getHeight()/canvas.height;
 if(Math.abs(sx-sy)>0.01)throw new Error("Source must be the original 16:9 slide export.");
 return {left:crop.x*sx,bottom:(canvas.height-crop.y-crop.height)*sy,right:(crop.x+crop.width)*sx,top:(canvas.height-crop.y)*sy};
}
