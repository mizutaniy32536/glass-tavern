/** A caught generation error is terminal; a transport error remains uncertain. */
export function generationFailure(error:unknown,stage:'memory'|'reply'){
  const reason=error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'AIの応答が制限時間内に完了しませんでした':error instanceof Error?error.message:'処理に失敗しました';
  return {code:'generation_failed',error:(stage==='memory'?'引き継ぎメモの整理で停止しました。保存済みのメモと入力文は残っています。':'会話の生成で停止しました。メモと入力文は残っています。')+' 理由: '+reason+' 再送信すると続きから処理します。'};
}
