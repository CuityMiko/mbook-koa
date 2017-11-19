import banner from './banner'
import theme from './theme'
import book from './book'
import user from './user'

export default function(router) {
    banner(router)
    theme(router)
    book(router)
    user(router)
}