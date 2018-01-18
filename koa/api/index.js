import banner from './banner'
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
import other from './other'

export default function(router) {
    banner(router)
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
    other(router)
}
