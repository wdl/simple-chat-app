let config = {
    token: null,
    chat: {
        title: null,
        last: 0,
        wt: 'init'
    },
    user: {
        me: {
            hash: null
        },
        users: []
    },
    page: {
        autoScroll: true,
        XHR: null
    }
}

function getXHR(url) {
    return new Promise((resolve, reject) => {
        config.page.XHR = new XMLHttpRequest()
        config.page.XHR.open('GET', url)
        config.page.XHR.setRequestHeader('Content-type', 'application/json')
        config.page.XHR.setRequestHeader('token', config.token)
        config.page.XHR.send()
        config.page.XHR.onload = () => {
            const result = JSON.parse(config.page.XHR.responseText)
            config.page.XHR = null
            resolve(result)
        }
        config.page.XHR.onerror = () => {
            config.page.XHR = null
            reject()
        }
    })
}

function setXHR(method, url, params = {}) {
    return new Promise((resolve, reject) => {
            const XHR = new XMLHttpRequest()
            XHR.open(method, url)
            XHR.setRequestHeader('Content-type', 'application/json')
            XHR.setRequestHeader('token', config.token)
            XHR.send(JSON.stringify(params))
            XHR.onload = () => {
                const result = JSON.parse(XHR.responseText)
                resolve(result)
            }
            XHR.onerror = () => {
                reject()
            }
    })
}

async function syncData(syncWithComments = false) {
    try {
        const res = await setXHR('PUT', '//api.chat.pedo.me/sync')
        if(!res.success) throw (res)

        if(document.querySelector('#loading').classList.contains('loading-now')) {
            document.querySelector('#loading').classList.remove('loading-now')
        }

        config.chat.title = res.data.chatInfo.title
        document.querySelector('title').innerText = config.chat.title
        document.querySelector('div.title').innerText = config.chat.title

        config.user.me.hash = res.data.userInfo.me
        config.user.users = res.data.userInfo.users
        document.querySelector('header .profile .image img').src = config.user.users.find(o => o.hash === config.user.me.hash).profileImage

        if((syncWithComments)
        && (res.data.comments.length > 0)) {
            commentsOrderd = res.data.comments.sort((a, b) => a.no - b.no)
            config.chat.last = Math.max(config.chat.last, commentsOrderd[commentsOrderd.length - 1].no)
            config.page.autoScroll = true
            makeDOM(commentsOrderd)
        }
    } catch(e) {
        console.error(e)
    }
}

async function readData() {
    try {
        if(config.page.XHR) return
        const res = await getXHR(`//api.chat.pedo.me/${config.chat.last}?wt=${config.chat.wt}`)
        if(res.data.comments.length > 0) {
            config.chat.wt = 'init'
            commentsOrderd = res.data.comments.sort((a, b) => a.no - b.no)
            config.chat.last = Math.max(config.chat.last, commentsOrderd[commentsOrderd.length - 1].no)
            
            makeDOM(commentsOrderd)
        } else {
            config.chat.wt = 'max'
        }
    } catch(e) {
        console.error(e)
    }
}

async function makeDOM(comments) {
    try {
        if(comments.length === 0) return
        for(let i = 0; i < comments.length; i++) {
            const main = document.querySelector('main')
            const lastComment = document.querySelector('article:last-child')
            const comment = comments[i]
            if(document.querySelector(`[data-no="${comment.no}"]`)) {
                continue
            }
            if(comment.writer === config.user.me.hash) {
                const article = document.createElement('article')
                article.classList.add('me')
                article.dataset.no = comment.no

                const time = new Date(comment.date).toLocaleTimeString('ko-kr', { timeStyle: 'short' })
                if((lastComment?.classList.contains("me"))
                && (time === lastComment.querySelector('div.time span').innerText)) {
                    lastComment.querySelector('div.time span').innerText = ""
                } else {
                    article.classList.add('gap')
                }

                const divTime = document.createElement('div')
                divTime.classList.add('time')

                const spanTime = document.createElement('span')
                spanTime.innerText = time

                divTime.appendChild(spanTime)

                const divBody = document.createElement('div')
                divBody.classList.add('body')

                const divComment = document.createElement('div')
                divComment.classList.add('comment')

                if(comment.type === "text") {
                    divComment.innerText = comment.data
                }

                divBody.appendChild(divComment)

                article.appendChild(divTime)
                article.appendChild(divBody)

                main.appendChild(article)
            } else {
                if(!config.user.users.find(o => o.hash === comment.writer)) {
                    await syncData(false)
                }
                let thread = false

                const article = document.createElement('article')
                article.classList.add('other')
                article.dataset.writer = comment.writer
                article.dataset.no = comment.no

                const time = new Date(comment.date).toLocaleTimeString('ko-kr', { timeStyle: 'short' })
                if((lastComment?.classList.contains("other"))
                && (comment.writer === lastComment.dataset.writer)
                && (time === lastComment.querySelector('div.time span').innerText)) {
                    thread = true
                    lastComment.querySelector('div.time span').innerText = ""
                } else {
                    article.classList.add('gap')
                }

                const divProfile = document.createElement('div')
                divProfile.classList.add('profile')

                if(!thread) {
                    const divImage = document.createElement('div')
                    divImage.classList.add('image')

                    const imgProfile = document.createElement('img')
                    imgProfile.src = config.user.users.find(o => o.hash === comment.writer).profileImage

                    divImage.appendChild(imgProfile)
                    divProfile.appendChild(divImage)
                }

                const divBody = document.createElement('div')
                divBody.classList.add('body')

                if(!thread) {
                    const divNick = document.createElement('div')
                    divNick.classList.add('nick')

                    const spanNick = document.createElement('span')
                    spanNick.style.color = config.user.users.find(o => o.hash === comment.writer).nicknameColor
                    spanNick.innerText = config.user.users.find(o => o.hash === comment.writer).nick

                    divNick.appendChild(spanNick)
                    divBody.appendChild(divNick)
                }

                const divComment = document.createElement('div')
                divComment.classList.add('comment')

                if(comment.type === "text") {
                    divComment.innerText = comment.data
                }

                divBody.appendChild(divComment)

                const divTime = document.createElement('div')
                divTime.classList.add('time')

                const spanTime = document.createElement('span')
                spanTime.innerText = time

                divTime.appendChild(spanTime)

                article.appendChild(divProfile)
                article.appendChild(divBody)
                article.appendChild(divTime)

                main.appendChild(article)
            }
            if(config.page.autoScroll) {
                main.scrollTop = main.scrollHeight - main.offsetHeight
            } else {
                document.querySelector('nav.go-down').classList.add('active')
            }
        }
    } catch(e) {
        console.error(e)
    }
}

function checkActive(event) {
    const comment = document.querySelector('#comment').value
    if(comment) {
        document.querySelector('.send-button').classList.add('activate')
    } else {
        document.querySelector('.send-button').classList.remove('activate')
    }

    if(event.keyCode == 13) {
        writeData()
    }
}

async function writeData() {
    const comment = document.querySelector('#comment').value
    document.querySelector('#comment').value = ""
    document.querySelector('.send-button').classList.remove('activate')
    if(comment) {
        const res = await setXHR('POST', '//api.chat.pedo.me/', {type: "text", data: comment})
        config.page.autoScroll = true
        makeDOM([{
            no: res.data.commentInsertNo,
            writer: config.user.me.hash,
            type: "text",
            data: comment,
            date: Date.now()
        }])
        if(!res.success) {
            document.querySelector('#comment').value = comment
            alert('알 수 없는 오류로 전송 실패')
        }
    }
    document.querySelector('#comment').focus()
}

function setAutoScroll() {
    const main = document.querySelector('main')
    if(main.scrollTop >= main.scrollHeight - main.offsetHeight) {
        document.querySelector('nav.go-down').classList.remove('active')
        config.page.autoScroll = true
    } else {
        document.querySelector('nav.go-down').classList.add('active')
        config.page.autoScroll = false
    }
}

function goScrollDown() {
    const main = document.querySelector('main')
    main.scrollTop = main.scrollHeight - main.offsetHeight
    setAutoScroll()
}

window.addEventListener('blur', () => {
    config.page.autoScroll = false
})

;(async () => {
    if(!config.token) {
        const qs = new URLSearchParams(location.search)
        if(qs.has('token')) {
            config.token = qs.get('token')
            history.pushState({}, '', '/')
        } else {
            location.href = "Auth_URL"
            return
        }
    }

    document.querySelector('#loading').classList.add('loading-now')
    await syncData(true)
    setInterval(readData, 500)
})()

