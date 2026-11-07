"""Generate src/lib/asl-vocab.ts from the model's real label map."""
import json

m = json.load(open('/home/z/my-project/sign-model/sign_to_prediction_index_map.json'))
words = sorted(m.keys(), key=lambda k: m[k])

everyday = [w for w in words if w in {
    'hello','bye','yes','no','please','thankyou','thanks','sorry','help','water','eat','drink',
    'apple','bath','bed','book','boy','girl','cat','dog','cousin','dad','mom','family','friend',
    'happy','sad','love','medicine','milk','name','school','sleep','stop','want','play','home',
    'brother','sister','grandma','grandpa','baby','bird','fish','run','walk','sit','stand',
    'good','bad','hot','cold','big','small','more','finish','now','later','today','tomorrow'
}]
print('total:', len(words), '| everyday subset:', len(everyday))

out = []
out.append('/**')
out.append(' * ASL vocabulary of the pretrained 250-class Isolated Sign Language')
out.append(' * Recognition model (Google - Isolated Sign Language Recognition,')
out.append(' * 1st-place solution, MIT licence).')
out.append(' *')
out.append(" * GENERATED from the model's actual sign_to_prediction_index_map.json -")
out.append(' * ids match the model output indices exactly. Do not edit by hand.')
out.append(' */')
out.append('')
out.append('export const ASL_CLASSES: readonly string[] = Object.freeze([')
for w in words:
    out.append(f'  {json.dumps(w)},')
out.append(']);')
out.append('')
out.append(f'export const ASL_CLASS_COUNT = {len(words)};')
out.append('')
out.append('/** Everyday words highlighted in the UI guide (all real model classes). */')
out.append('export const EVERYDAY_WORDS: readonly string[] = Object.freeze([')
for w in everyday:
    out.append(f'  {json.dumps(w)},')
out.append(']);')
out.append('')
out.append('export interface AslClassInfo {')
out.append('  id: number;')
out.append('  word: string;')
out.append('}')
out.append('')
out.append('export function aslClassInfo(word: string): AslClassInfo | null {')
out.append('  const id = ASL_CLASSES.indexOf(word);')
out.append('  return id === -1 ? null : { id, word };')
out.append('}')
with open('/home/z/my-project/src/lib/asl-vocab.ts', 'w') as f:
    f.write('\n'.join(out) + '\n')
print('written src/lib/asl-vocab.ts')
