/** 台詞唯一編輯入口。短句皆為本專案原創，不使用長篇原作對白。 */
export const actions = {
  greet: '欸欸～大姊姊～',
  beam: '動感光波～逼逼逼～!',
  wiggle: '噗哩噗哩～',
  sleep: '晚安～',
} as const;
export const wake = ['嗯…再睡五分鐘啦…'] as const;
export const pools = {
  greeting: ['嘿嘿～陪我玩嘛～', '你戳到小帥哥啦～', '喔唷～是你喔！', '人家剛好有空啦～', '點心有我的份嗎？'],
  idle: ['肚子在開演唱會耶～', '今天也帥得好累喔～', '春日部的風香香的～', '再一下就去買布丁～', '小白在等我散步啦～'],
  save: ['存好了喔～', '嘿嘿～這下安心啦～', '有存有保庇耶～', '這份作業收好囉～', '按得好！吃塊餅乾～'],
  error: ['哎呀～出錯了啦', '這裡好像打結了耶～', '慢慢解開就好啦～', '小紅字在叫你喔～', '休息一下再試嘛～'],
} as const;
export type PoolName = keyof typeof pools;
