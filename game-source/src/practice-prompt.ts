// Keep optional practice prompts free of the target glyph without changing combat questions.
const overrides:Record<string,string>={
 父:'おとうさん「ちち」',母:'おかあさん「はは」',家:'かぞくが住む「いえ」',
 国:'日本などの「くに」',学:'がっこうで「まな」ぶ',金:'黄色く光るきんぞく「きん」'
};
export function practicePrompt(character:string,prompt:string){return overrides[character]??prompt;}
