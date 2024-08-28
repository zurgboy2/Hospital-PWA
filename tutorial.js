// tutorial.js

import { __ } from './i18n.js';  // Import the translation function

class TutorialSystem {
  constructor() {
    this.currentStep = 0;
    this.tutorialSteps = {
      login: [
        {
          titleKey: "tutorialLoginTitle",
          contentKey: "tutorialLoginContent",
          target: "#loginForm"
        },
        {
          titleKey: "tutorialCreateAccountTitle",
          contentKey: "tutorialCreateAccountContent",
          target: "#createAccountLink"
        }
      ],
      dashboard: {
        info: [
          {
            titleKey: "tutorialArticlesOverviewTitle",
            contentKey: "tutorialArticlesOverviewContent",
            target: "#articlesList"
          },
          {
            titleKey: "tutorialReadingArticlesTitle",
            contentKey: "tutorialReadingArticlesContent",
            target: ".article-item button"
          }
        ],
        personal: [
          {
            titleKey: "tutorialPersonalInfoTitle",
            contentKey: "tutorialPersonalInfoContent",
            target: "#personalInfoForm"
          },
          {
            titleKey: "tutorialSavingInfoTitle",
            contentKey: "tutorialSavingInfoContent",
            target: "button[type='submit']"
          }
        ],
        notes: [
          {
            titleKey: "tutorialSecureNotesTitle",
            contentKey: "tutorialSecureNotesContent",
            target: "#notesList"
          },
          {
            titleKey: "tutorialAddingNoteTitle",
            contentKey: "tutorialAddingNoteContent",
            target: "#addNoteBtn"
          }
        ],
        health: [
          {
            titleKey: "tutorialHealthTrackerTitle",
            contentKey: "tutorialHealthTrackerContent",
            target: "#healthTrackerForm"
          },
          {
            titleKey: "tutorialHealthChartTitle",
            contentKey: "tutorialHealthChartContent",
            target: "#healthChartContainer"
          },
          {
            titleKey: "tutorialHealthHistoryTitle",
            contentKey: "tutorialHealthHistoryContent",
            target: "#healthDataList"
          }
        ],
        requests: [
          {
            titleKey: "tutorialDoctorRequestsTitle",
            contentKey: "tutorialDoctorRequestsContent",
            target: "#requestsList"
          },
          {
            titleKey: "tutorialManageRequestsTitle",
            contentKey: "tutorialManageRequestsContent",
            target: ".request-actions"
          }
        ],
        settings: [
          {
            titleKey: "tutorialSettingsOverviewTitle",
            contentKey: "tutorialSettingsOverviewContent",
            target: "#settingsTab"
          },
          {
            titleKey: "tutorialBackupRecoveryTitle",
            contentKey: "tutorialBackupRecoveryContent",
            target: ".backup-section"
          },
          {
            titleKey: "tutorialDataExportTitle",
            contentKey: "tutorialDataExportContent",
            target: ".export-section"
          }
        ]
      }
    };
  }

  start() {
    if (this.isLoginVisible()) {
      this.startLoginTutorial();
    } else {
      this.startDashboardTutorial();
    }
  }

  isLoginVisible() {
    return document.getElementById('loginSection').style.display !== 'none';
  }

  startLoginTutorial() {
    this.currentStep = 0;
    if (this.tutorialSteps.login && this.tutorialSteps.login.length > 0) {
      this.showStep(this.tutorialSteps.login[this.currentStep]);
    } else {
      console.error('Login tutorial steps are not defined or empty');
    }
  }

  startDashboardTutorial() {
    const activeTab = this.getActiveTab();
    if (activeTab && this.tutorialSteps.dashboard && this.tutorialSteps.dashboard[activeTab]) {
      this.currentStep = 0;
      if (this.tutorialSteps.dashboard[activeTab].length > 0) {
        this.showStep(this.tutorialSteps.dashboard[activeTab][this.currentStep]);
      } else {
        console.error(`No tutorial steps defined for the "${activeTab}" tab`);
      }
    } else {
      console.error('No active tab found or tutorial steps not defined for the active tab');
    }
  }

  getActiveTab() {
    const activeTabButton = document.querySelector('.tab-button.active');
    return activeTabButton ? activeTabButton.getAttribute('data-tab') : null;
  }

  showStep(step) {
    if (!step) {
      console.error('Invalid tutorial step');
      return;
    }

    const target = document.querySelector(step.target);
    if (!target) {
      console.error(`Target element not found: ${step.target}`);
      return;
    }

    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.className = 'tutorial-overlay';
    tutorialOverlay.innerHTML = `
      <div class="tutorial-content">
        <h2>${__(step.titleKey)}</h2>
        <p>${__(step.contentKey)}</p>
        <div class="tutorial-navigation">
          ${this.currentStep > 0 ? `<button class="tutorial-prev">${__('tutorialPrevious')}</button>` : ''}
          <button class="tutorial-next">${__('tutorialNext')}</button>
          <button class="tutorial-end">${__('tutorialEnd')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(tutorialOverlay);
    this.positionTutorialContent(tutorialOverlay, target);
    this.addTutorialListeners(tutorialOverlay);
  }

  positionTutorialContent(overlay, target) {
    const content = overlay.querySelector('.tutorial-content');
    const targetRect = target.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    let top = targetRect.bottom + 10;
    let left = targetRect.left;

    if (top + contentRect.height > window.innerHeight) {
      top = targetRect.top - contentRect.height - 10;
    }

    if (left + contentRect.width > window.innerWidth) {
      left = window.innerWidth - contentRect.width - 10;
    }

    content.style.position = 'absolute';
    content.style.top = `${top}px`;
    content.style.left = `${left}px`;
  }

  addTutorialListeners(overlay) {
    const nextButton = overlay.querySelector('.tutorial-next');
    const prevButton = overlay.querySelector('.tutorial-prev');
    const endButton = overlay.querySelector('.tutorial-end');

    nextButton.addEventListener('click', () => this.nextStep());
    if (prevButton) {
      prevButton.addEventListener('click', () => this.prevStep());
    }
    endButton.addEventListener('click', () => this.endTutorial());
  }

  nextStep() {
    const currentSteps = this.isLoginVisible() ? this.tutorialSteps.login : this.tutorialSteps.dashboard[this.getActiveTab()];
    if (currentSteps && this.currentStep < currentSteps.length - 1) {
      this.currentStep++;
      document.querySelector('.tutorial-overlay').remove();
      this.showStep(currentSteps[this.currentStep]);
    } else {
      this.endTutorial();
    }
  }

  prevStep() {
    const currentSteps = this.isLoginVisible() ? this.tutorialSteps.login : this.tutorialSteps.dashboard[this.getActiveTab()];
    if (currentSteps && this.currentStep > 0) {
      this.currentStep--;
      document.querySelector('.tutorial-overlay').remove();
      this.showStep(currentSteps[this.currentStep]);
    }
  }

  endTutorial() {
    const overlay = document.querySelector('.tutorial-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

// Initialize the tutorial system
const tutorial = new TutorialSystem();

// Add event listener to start the tutorial
document.addEventListener('DOMContentLoaded', () => {
  const tutorialButton = document.getElementById('tutorialButton');
  if (tutorialButton) {
    tutorialButton.addEventListener('click', () => tutorial.start());
  } else {
    console.error('Tutorial button not found');
  }

  // Listen for tab changes to update the tutorial
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      if (document.querySelector('.tutorial-overlay')) {
        tutorial.startDashboardTutorial();
      }
    });
  });
});