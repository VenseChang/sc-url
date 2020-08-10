(() => {
    const app = Stimulus.Application.start()
    let   settings = {}

    app.register("setting", class extends Stimulus.Controller {
        static get targets() {
            return [ 'shortcut', 'url', 'detail', 'filter' ]
        }

        add = (event) => {
            event.preventDefault()
            const sc  = this.shortcutTarget
            const url = this.urlTarget

            if ( sc.value.trim() === '' || url.value.trim() === '' ) {
                alert("shortcut or url can't be empty")
                return
            }

            settings[sc.value.trim()] = url.value.trim()
            this.save()

            sc.value = ''
            url.value = ''
        }

        delete = (el) => {
            const sc = el.target.dataset.params
            if ( confirm(`Are you sure to remove this shortcut(${sc})?`) ) {
                delete settings[sc]
                this.save()
            }
        }

        filter = () => {
            let targets = {}
            const val = this.filterTarget.value.toLowerCase()

            if (val === '') { this.reload(); return; }

            for (let sc in settings) {
                if (sc.toLowerCase().includes(val) || settings[sc].toLowerCase().includes(val)) {
                    targets[sc] = settings[sc]
                }
            }

            this.reload(targets)
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

        reload = (ss) => {
            let addBG = false
            this.detailTarget.innerHTML = ''

            Object.keys(ss || settings).sort().forEach( sc => {
                let content = ''

                content += '<div class="mx-4">'
                content += '    <div class="font-bold text-lg">'
                content += `        ${sc}`
                content += '    </div>'
                content += '    <div class="flex">'
                content += '        <div class="w-1/6"> </div>'
                content += '        <div class="w-4/6 break-all flex items-center text-sm">'
                content += `            ${settings[sc]}`
                content += '        </div>'
                content += '        <div class="w-1/6 text-center flex">'
                // content += `            <img data-action="click->setting#edit" data-params="${sc}" src='../images/edit.png' style='height: 24px; width: 24px;' class='mx-1 cursor-pointer' />`
                content += `            <img data-action="click->setting#delete" data-params="${sc}" src='../images/trash.png' style='height: 24px; width: 24px;' class='mx-1 cursor-pointer' />`
                content += '        </div>'
                content += '    </div>'
                content += '</div>'
                content += '<hr class="border my-6 mx-4">'

                this.detailTarget.innerHTML += content
                addBG = !addBG
            })
        }

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
