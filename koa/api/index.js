import banner from './banner'
import theme from './theme'
import book from './book'
import chapter from './chapter'
import user from './user'
import booklist from './booklist'
import comment from './comment'

export default function(router) {
    banner(router)
    theme(router)
    book(router)
    chapter(router)
    user(router)
    booklist(router)
    comment(router)
}
