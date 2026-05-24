/**
 * TaskFlow Application System
 * Handles application lists, local savings, filters, and display pipelines.
 */

class SimpleTodoApp {
    constructor() {
        // Load tasks from browser memory storage, or start empty if none exist
        this.tasks = JSON.parse(localStorage.getItem('taskflow_todo_list')) || [];
        this.currentFilter = 'all';

        // Cache DOM Element node connections
        this.domCache = {
            preloader: document.getElementById('preloader'),
            actionForm: document.getElementById('action-dispatch-form'),
            inputField: document.getElementById('target-input-field'),
            renderContainer: document.getElementById('render-target-list'),
            emptyFrame: document.getElementById('empty-state-frame'),
            filterNodes: document.querySelectorAll('.matrix-btn'),
            counterString: document.getElementById('task-counter-string'),
            progressCircle: document.getElementById('progress-circle'),
            progressPercent: document.getElementById('progress-percent'),
            macroFab: document.getElementById('scroll-macro-fab'),
            liveDate: document.getElementById('live-date'),
            countAll: document.getElementById('count-all'),
            countPending: document.getElementById('count-pending'),
            countCompleted: document.getElementById('count-completed')
        };

        this.init();
    }

    /**
     * Start the application setups
     */
    init() {
        this.registerGlobalEventHandlers();
        this.setupCurrentCalendarDate();
        this.hideLoadingScreen(500);
        this.updateUserInterfaceList();
    }

    /**
     * Bind all action button listener items
     */
    registerGlobalEventHandlers() {
        // Intercept form submission to add new list item entries
        this.domCache.actionForm.addEventListener('submit', (event) => this.addNewTaskItem(event));

        // Setup filter click buttons layout options switching
        this.domCache.filterNodes.forEach(node => {
            node.addEventListener('click', (e) => {
                const clickTarget = e.currentTarget;
                this.domCache.filterNodes.forEach(n => {
                    n.classList.remove('active');
                    n.setAttribute('aria-selected', 'false');
                });
                clickTarget.classList.add('active');
                clickTarget.setAttribute('aria-selected', 'true');
                this.currentFilter = clickTarget.dataset.filter;
                this.updateUserInterfaceList();
            });
        });

        // Watch page scrolls to display "Back to Top" macro button
        window.addEventListener('scroll', () => {
            if (window.scrollY > 250) {
                this.domCache.macroFab.classList.add('state-revealed');
            } else {
                this.domCache.macroFab.classList.remove('state-revealed');
            }
        });

        this.domCache.macroFab.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /**
     * Create a new item tracking structure package
     */
    addNewTaskItem(event) {
        event.preventDefault();
        const textValue = this.domCache.inputField.value.trim();
        if (!textValue) return;

        const taskObject = {
            id: 'item_' + Date.now() + Math.floor(Math.random() * 100),
            text: textValue,
            completed: false
        };

        this.tasks.unshift(taskObject); // Puts new items right at the top
        this.saveCurrentListToStorage();
        this.domCache.inputField.value = '';
        this.updateUserInterfaceList();
    }

    /**
     * Redraw the viewport items list stack
     */
    updateUserInterfaceList() {
        // Filter the tasks depending on chosen tab view setting rules
        const displayedTasks = this.tasks.filter(item => {
            if (this.currentFilter === 'pending') return !item.completed;
            if (this.currentFilter === 'completed') return item.completed;
            return true;
        });

        this.domCache.renderContainer.innerHTML = '';

        // If list is empty, show empty state message window box
        if (displayedTasks.length === 0) {
            this.domCache.emptyFrame.style.display = 'block';
        } else {
            this.domCache.emptyFrame.style.display = 'none';

            // Build visual elements one by one down into list node fragments
            const itemsListFragment = document.createDocumentFragment();
            displayedTasks.forEach(item => {
                const compiledRow = this.createTaskRowElementHTML(item);
                itemsListFragment.appendChild(compiledRow);
            });
            this.domCache.renderContainer.appendChild(itemsListFragment);
        }

        this.recalculateTaskPercentagesMetrics();
    }

    /**
     * Manufacture independent rows blocks for standard layout inclusion lists
     */
    createTaskRowElementHTML(item) {
        const rowLi = document.createElement('li');
        rowLi.className = `task-composite-card ${item.completed ? 'status-resolved' : ''}`;
        rowLi.id = item.id;

        rowLi.innerHTML = `
            <div class="card-node-left">
                <label class="checkbox-trigger-envelope">
                    <input type="checkbox" ${item.completed ? 'checked' : ''}>
                    <span class="custom-poly-checkmark"></span>
                </label>
                <span class="node-content-text"></span>
            </div>
            <div class="card-node-actions">
                <button class="utility-action-anchor action-mutate-trigger" title="Edit this item">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="utility-action-anchor action-purge-trigger" title="Delete this item">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;

        // Direct secure text strings assign parsing protect against dangerous inputs injections
        rowLi.querySelector('.node-content-text').innerText = item.text;

        // Wire change state interactions
        rowLi.querySelector('input[type="checkbox"]').addEventListener('change', () => {
            this.toggleTaskCompletionState(item.id);
        });

        rowLi.querySelector('.action-purge-trigger').addEventListener('click', () => {
            this.removeTaskRowWithAnimation(item.id, rowLi);
        });

        rowLi.querySelector('.action-mutate-trigger').addEventListener('click', () => {
            this.openInlineEditingBoxField(item.id, rowLi);
        });

        return rowLi;
    }

    /**
     * Switch item checks completeness toggles updates
     */
    toggleTaskCompletionState(id) {
        this.tasks = this.tasks.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
        this.saveCurrentListToStorage();
        // Give a micro second delay to appreciate the smooth finish cross lines animations animations
        setTimeout(() => this.updateUserInterfaceList(), 180);
    }

    /**
     * Delete tracking node row entries with fading exit flows animations animations
     */
    removeTaskRowWithAnimation(id, rowLi) {
        rowLi.classList.add('node-evacuation-sequence');
        rowLi.addEventListener('animationend', () => {
            this.tasks = this.tasks.filter(item => item.id !== id);
            this.saveCurrentListToStorage();
            this.updateUserInterfaceList();
        });
    }

    /**
     * Inline row editing field generation switch tools
     */
    openInlineEditingBoxField(id, rowLi) {
        const textSpan = rowLi.querySelector('.node-content-text');
        if (!textSpan) return;

        const previousString = textSpan.innerText;
        const inlineInputBox = document.createElement('input');
        inlineInputBox.type = 'text';
        inlineInputBox.className = 'node-mutation-input';
        inlineInputBox.value = previousString;

        const contentLeftContainer = rowLi.querySelector('.card-node-left');
        contentLeftContainer.replaceChild(inlineInputBox, textSpan);
        inlineInputBox.focus();

        const saveChangesAction = () => {
            const finishedStringValue = inlineInputBox.value.trim();
            if (finishedStringValue && finishedStringValue !== previousString) {
                this.tasks = this.tasks.map(item => item.id === id ? { ...item, text: finishedStringValue } : item);
                this.saveCurrentListToStorage();
            }
            this.updateUserInterfaceList();
        };

        inlineInputBox.addEventListener('blur', saveChangesAction);
        inlineInputBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveChangesAction();
            if (e.key === 'Escape') this.updateUserInterfaceList();
        });
    }

    /**
     * Mathematical accounting formulas managing tracking counter metrics values updates
     */
    recalculateTaskPercentagesMetrics() {
        const totalItemsCount = this.tasks.length;
        const finishedItemsCount = this.tasks.filter(item => item.completed).length;
        const pendingItemsCount = totalItemsCount - finishedItemsCount;
        
        // String numbers counters matching
        this.domCache.counterString.innerText = `${finishedItemsCount} / ${totalItemsCount} Completed`;

        // Counter sidebar indicators chips numbers updating synchronization
        this.domCache.countAll.innerText = totalItemsCount;
        this.domCache.countPending.innerText = pendingItemsCount;
        this.domCache.countCompleted.innerText = finishedItemsCount;

        // Visual mathematical ratios conversion processing for circular widgets bars rings
        const conversionPercentageValue = totalItemsCount === 0 ? 0 : Math.round((finishedItemsCount / totalItemsCount) * 100);
        this.domCache.progressPercent.innerText = `${conversionPercentageValue}%`;

        const circleRadiusSizeValue = 18;
        const circleBorderCircumferenceSize = 2 * Math.PI * circleRadiusSizeValue; // Evaluates metric to value: ~113.097
        const drawingOffsetOffsetMetric = circleBorderCircumferenceSize - (conversionPercentageValue / 100) * circleBorderCircumferenceSize;

        this.domCache.progressCircle.style.strokeDashoffset = drawingOffsetOffsetMetric;
    }

    setupCurrentCalendarDate() {
        const viewDateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        this.domCache.liveDate.innerText = new Date().toLocaleDateString('en-US', viewDateOptions);
    }

    saveCurrentListToStorage() {
        localStorage.setItem('taskflow_todo_list', JSON.stringify(this.tasks));
    }

    hideLoadingScreen(msDelay) {
        setTimeout(() => {
            if (this.domCache.preloader) {
                this.domCache.preloader.classList.add('fade-out');
            }
        }, msDelay);
    }
}

// Start application runtime once document parsing finishes safely
document.addEventListener('DOMContentLoaded', () => {
    window.UserGlobalTodoEngineContext = new SimpleTodoApp();
});