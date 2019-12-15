import banner from './banner'
import advisement from './advisement'
import theme from './theme'
import book from './book'
import chapter from './chapter'
import user from './user'
import booklist from './booklist'
import comment from './comment'
import good from './good'
import pay from './pay'
import buy from './buy'
import charge from './charge'
import attendance from './attendance'
import setting from './setting'
import share from './share'
import award from './award'
import secret from './secret'
import formid from './formid'
import friendHelpBook from './friendHelpBook'
import friendHelp from './friendHelp'
import dialog from './dialog'
import notice from './notice'
import voiceTrans from './voiceTrans'
import recommend from './recommend'
import other from './other'

export default function(router) {
  banner(router)
  advisement(router)
  theme(router)
  book(router)
  chapter(router)
  user(router)
  booklist(router)
  comment(router)
  good(router)
  pay(router)
  buy(router)
  charge(router)
  attendance(router)
  setting(router)
  share(router)
  award(router)
  secret(router)
  formid(router)
  friendHelpBook(router)
  friendHelp(router)
  dialog(router)
  notice(router)
  voiceTrans(router)
  recommend(router)
  other(router)
}
