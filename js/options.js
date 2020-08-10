(() => {
    const REPLACE_VALUE_REGEX = /(?!\s)(\$\d+)*/g
    const app = Stimulus.Application.start()
    let   settings = {}

    app.register("setting", class extends Stimulus.Controller {
        static get targets() {
            return [ 'shortcut', 'url', 'detail', 'filter' ]
        }

        add = (event) => {
            event.preventDefault()

            const sc  = this.shortcutTarget.value.trim()
            const url = this.urlTarget.value.trim()

            if ( sc === '' || url === '' ) {
                alert("shortcut or url can't be empty")
                return
            }

            if(settings[sc] === undefined) { settings[sc] = [] }

            let oldUrl = settings[sc].find(u => this.matchUrl(u).length === this.matchUrl(url).length)
            if ( oldUrl !== undefined && confirm(`Are you sure to replace 「${oldUrl}」 with 「${url}」?`) ) {
                settings[sc] = settings[sc].filter(u => this.matchUrl(u).length !== this.matchUrl(url).length)
            }

            settings[sc].push(url)
            this.save()

            this.urlTarget.value = ''
            this.shortcutTarget.value = ''
        }

        filter = () => {
            let targets = {}
            const val = this.filterTarget.value.toLowerCase()

            if (val === '') { this.reload(); return; }

            Object.keys(settings)
                  .filter(sc => this.isInclude(sc, val) || settings[sc].filter(target => this.isInclude(target, val)).length > 0)
                  .forEach(sc => {targets[sc] = settings[sc]})

            for (let sc in targets) {
                let new_targets = targets[sc].filter(target => this.isInclude(target, val))
                if(new_targets.length > 0) { targets[sc] = new_targets }
            }

            this.reload(targets)
        }

        matchUrl = (url) => url.match(REPLACE_VALUE_REGEX).filter(v => v)

        reload = (ss) => {
            let targets = ss || settings
            this.detailTarget.innerHTML = ''

            Object.keys(targets).sort().forEach( sc => {
                let content = ''

                content += '<div class="mx-4">'
                content += '    <div class="font-bold text-lg">'
                content += `        ${sc}`
                content += '    </div>'
                targets[sc].forEach(target => {
                    content += '    <div class="flex my-4">'
                    content += '        <div class="w-1/6"> </div>'
                    content += '        <div class="w-4/6 break-all flex items-center text-sm">'
                    content += `            ${target}`
                    content += '        </div>'
                    content += '        <div class="w-1/6 text-center flex">'
                    // content += `            <img data-action="click->setting#edit" data-params="${sc}" src='../images/edit.png' style='height: 24px; width: 24px;' class='mx-1 cursor-pointer' />`
                    content += `            <img data-action="click->setting#delete" data-shortcut=${sc} data-params="${target}" src='../images/trash.png' style='height: 24px; width: 24px;' class='mx-1 cursor-pointer' />`
                    content += '        </div>'
                    content += '    </div>'
                })
                content += '</div>'
                content += '<hr class="border my-6 mx-4">'

                this.detailTarget.innerHTML += content
            })
        }

        import = (e) => {
            let files = e.target.files
            if (files.length !== 1) return

            let file = files.item(0)
            var fr = new FileReader();
            fr.onload = event => {
                let res = event.target.result
                settings = JSON.parse(res)
                this.save()
            }
            fr.readAsText(file)
            e.target.value = ''
        }

        export = () => {
            if (Object.entries(settings).length === 0) {alert('The setting is empty!'); return;}

            let dataStr = JSON.stringify(settings)
            let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

            let linkElement = document.createElement('a')
            linkElement.setAttribute('href', dataUri)
            linkElement.setAttribute('download', 'sc.json')
            linkElement.click()
        }

        save = () => {
            this.reload()
            chrome.storage.local.set({"settings": settings}, function() {})
            chrome.storage.sync.set({"settings": settings}, function() {})
        }

        delete = (el) => {
            const sc = el.target.dataset.shortcut
            const target = el.target.dataset.params
            if ( confirm(`Are you sure to remove target 「${target}」 from shortcut「${sc}」?`) ) {
                settings[sc] = settings[sc].filter(t => t !== target)
                if(settings[sc].length === 0) { delete settings[sc] }
                this.save()
            }
        }

        isInclude = (item, target) => item.toLowerCase().includes(target)

        // Stimulus Lifecycle
        initialize() {
            chrome.storage.local.get("settings", res => {
                settings = res.settings || {}
                this.reload()
            })
            chrome.storage.sync.get("settings", res => {
                if (Object.entries(settings).length === 0) {
                    settings = res.settings || {}
                    chrome.storage.local.set({"settings": settings}, function() {})
                    this.reload()
                }
            })
        }
    })
  })()
