/**
 * ENTRY CONTROLLER
 * Manages individual project entry pages
 * Loads data from manifest, populates content, generates related posts
 */

const EntryController = (() => {

  /**
   * Get entry path from URL or sessionStorage
   * @returns {String} - Entry path like "web/html-css-js/project-slug"
   */
  function getEntryPath() {
    // LOCALHOST TESTING: Check for URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get('path');

    if (pathParam) {
      console.log(`🔍 Entry URL param: path=${pathParam}`);
      return pathParam;
    }

    // PRODUCTION: Check sessionStorage (set by 404.html)
    const storedPath = sessionStorage.getItem('entryPath');
    if (storedPath) {
      sessionStorage.removeItem('entryPath'); // Clean up
      return storedPath.replace(/^\//, ''); // Remove leading slash
    }

    // Fallback to current URL path
    return window.location.pathname.replace(/^\//, '');
  }

  /**
   * Load entry data from manifest
   * @param {String} entryPath - Path like "web/html-css-js/project-slug"
   * @returns {Object} - Project JSON data
   */
  async function loadEntryData(entryPath) {
    const manifest = await DataLoader.loadManifest();

    // Find JSON path in manifest
    const jsonPath = manifest.entries[entryPath];

    if (!jsonPath) {
      console.error(`❌ Entry not found in manifest: ${entryPath}`);
      return null;
    }

    // Load project JSON
    const project = await DataLoader.loadProject(jsonPath);
    return project;
  }

  /**
   * Populate page metadata (SEO tags)
   */
  function populateMetadata(project) {
    const { content } = project;
    const { media, teaser_copy } = content;

    // Update page title
    document.title = teaser_copy.seo_title || teaser_copy.page_title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', teaser_copy.seo_description || '');
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', teaser_copy.seo_title || teaser_copy.page_title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', teaser_copy.seo_description || '');
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && media.thumbnail_images && media.thumbnail_images[0]) {
      ogImage.setAttribute('content', `/${media.thumbnail_images[0]}`);
    }

    const ogImageAlt = document.querySelector('meta[property="og:image:alt"]');
    if (ogImageAlt) {
      ogImageAlt.setAttribute('content', media.thumb_slideshow_alt_text || teaser_copy.page_title);
    }
  }

  /**
   * Populate breadcrumbs
   * Sub_section links use hash filtering (not special pages)
   */
  function populateBreadcrumbs(project) {
    const { categorization, content } = project;
    const { placement } = categorization;
    const { teaser_copy } = content;

    const breadcrumbContainers = document.querySelectorAll('.entry-breadcrumbs');

    breadcrumbContainers.forEach(container => {
      const sectionURL = `/${DataLoader.normalizeForURL(placement.section)}`;

      // Sub_section uses hash filtering, not a special page
      const normalizedSection = DataLoader.normalizeForURL(placement.section);
      const normalizedSubsection = DataLoader.normalizeForURL(placement.sub_section);
      const subsectionURL = `/${normalizedSection}#tags=${normalizedSection}+${normalizedSubsection}`;

      container.innerHTML = `
                <a href="/">Home</a>
                <span class="breadcrumb-separator">›</span>
                <a href="${sectionURL}">${placement.section}</a>
                <span class="breadcrumb-separator">›</span>
                <a href="${subsectionURL}">${placement.sub_section}</a>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">${teaser_copy.breadcrumb}</span>
            `;
    });
  }

  /**
   * Populate tags hover cards (top-right and bottom-right)
   * ONLY includes technology/media/skill tags (NOT section/subsection/role)
   * Links go to site-wide tag filtering (shows ALL projects with that tag)
   */
  function populateTagsCards(project) {
    const { categorization } = project;
    const { tagging } = categorization;

    // Combine technology, media, and skill tags
    const allTags = [
      ...tagging.technology,
      ...tagging.media,
      ...tagging.skill
    ];

    const tagsCardContainers = document.querySelectorAll('.entry-tags-card');

    tagsCardContainers.forEach(container => {
      container.innerHTML = allTags.map(tag => {
        // Site-wide tag filtering: shows ALL projects with this tag (not just current section)
        const tagURL = `/projects#tag=${DataLoader.normalizeForURL(tag)}`;
        return `<a href="${tagURL}" class="entry-tag">${tag}</a>`;
      }).join(' • ');
    });
  }

  /**
   * Populate main content sections
   */
  function populateContent(project) {
    const { categorization, content } = project;
    const { tagging } = categorization;
    const { media, assets, teaser_copy, page_copy } = content;

    // Page title and subtitle
    const titleEl = document.getElementById('entry-title');
    if (titleEl) titleEl.textContent = teaser_copy.page_title;

    const subtitleEl = document.getElementById('entry-subtitle');
    if (subtitleEl) subtitleEl.textContent = teaser_copy.page_subtitle;

    // Role (H3 heading)
    const roleEl = document.getElementById('entry-role');
    if (roleEl) roleEl.textContent = tagging.role;

    // Page copy sections (pattern, action, measured)
    const patternEl = document.getElementById('entry-pattern');
    if (patternEl) patternEl.textContent = page_copy.pattern;

    const actionEl = document.getElementById('entry-action');
    if (actionEl) actionEl.textContent = page_copy.action;

    const measuredEl = document.getElementById('entry-measured');
    if (measuredEl) measuredEl.textContent = page_copy.measured;

    // Thumbnail images (shuffled and split between column and grid)
    populateThumbnailImages(media);

    // Optional: Video embed
    if (media.video_embed) {
      populateVideoEmbed(media);
    }

    // Optional: Page imagery
    if (media.page_imagery && media.page_imagery.length > 0) {
      populatePageImagery(media);
    }

    // Optional: Project URL
    if (assets && assets.project_url) {
      populateProjectURL(assets);
    }

    // Optional: GitHub repository
    if (assets && assets.github_repository) {
      populateGitHubRepo(assets.github_repository);
    }
  }

  /**
   * Populate thumbnail images in new layout
   * - Shuffles images on each reload
   * - Desktop: First 3 in column, rest in grid
   * - Mobile: All images in grid (column hidden via CSS)
   */
  function populateThumbnailImages(media) {
    const columnContainer = document.getElementById('entry-thumbnail-images-column');
    const gridContainer = document.getElementById('entry-thumbnail-images-grid');

    if (!media.thumbnail_images || media.thumbnail_images.length === 0) return;

    // Shuffle images for variety on each reload
    const shuffledImages = DataLoader.shuffleArray([...media.thumbnail_images]);
    const altText = media.thumb_slideshow_alt_text || 'Project image';

    // Split images: first 3 for column (desktop), rest for grid
    const columnImages = shuffledImages.slice(0, 3);
    const gridImages = shuffledImages.slice(3);

    // Populate column container (first 3 images - desktop only, hidden on mobile)
    if (columnContainer && columnImages.length > 0) {
      columnContainer.innerHTML = columnImages.map(img => `
                <img
                    src="/${img}"
                    alt="${altText}"
                    class="entry-thumbnail-image"
                    loading="lazy"
                />
            `).join('');
    }

    // Populate grid container
    // Desktop: Remaining images (after first 3)
    // Mobile: ALL images (column is hidden)
    if (gridContainer) {
      const isMobile = window.innerWidth < 768;
      const imagesToShow = isMobile ? shuffledImages : gridImages;

      if (imagesToShow.length > 0) {
        gridContainer.innerHTML = imagesToShow.map(img => `
                    <img
                        src="/${img}"
                        alt="${altText}"
                        class="entry-thumbnail-image"
                        loading="lazy"
                    />
                `).join('');
        gridContainer.style.display = 'grid';
      }
    }
  }

  /**
   * Populate video embed
   */
  function populateVideoEmbed(media) {
    const container = document.getElementById('entry-video');
    if (!container) return;

    container.innerHTML = `
            <div class="video-container">
                ${media.video_embed}
            </div>
        `;
    container.style.display = 'block';
  }

  /**
   * Populate page imagery section
   */
  function populatePageImagery(media) {
    const container = document.getElementById('entry-page-imagery');
    if (!container) return;

    container.innerHTML = media.page_imagery.map((img, index) => `
            <img
                src="/${img}"
                alt="${media.page_image_group_alt_text || 'Additional project image'}"
                class="entry-page-image ${index === 0 ? 'active' : ''}"
                loading="lazy"
            />
        `).join('');
    container.style.display = 'block';

    // Add swipe if multiple images
    if (media.page_imagery.length > 1) {
      addPageImagerySwipe(container, media.page_imagery.length);
    }
  }

  /**
   * Add swipe functionality to page imagery
   */
  function addPageImagerySwipe(container, imageCount) {
    let startX = 0;
    let currentIndex = 0;
    const images = container.querySelectorAll('.entry-page-image');

    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentIndex < imageCount - 1) {
          currentIndex++;
        } else if (diff < 0 && currentIndex > 0) {
          currentIndex--;
        }

        images.forEach((img, index) => {
          img.classList.toggle('active', index === currentIndex);
        });
      }
    }, { passive: true });
  }

  /**
   * Populate project URL embed
   */
  function populateProjectURL(assets) {
    const container = document.getElementById('entry-project-url');
    if (!container || !assets.project_url) return;

    // Use project_url_text if available, otherwise show full URL
    const displayText = assets.project_url_text || assets.project_url;

    container.innerHTML = `
            <a href="${assets.project_url}" target="_blank" rel="noopener noreferrer" class="project-link-card">
                <span class="link-icon">🔗</span>
                <span class="link-url">${displayText}</span>
            </a>
        `;
    container.style.display = 'block';
  }

  /**
   * Populate GitHub repository embed
   */
  function populateGitHubRepo(url) {
    const container = document.getElementById('entry-github-repo');
    if (!container) return;

    // Extract owner/repo from URL
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    const repoName = match ? `${match[1]}/${match[2]}` : url;

    container.innerHTML = `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="github-repo-card">
                <svg class="github-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span class="repo-name">${repoName}</span>
            </a>
        `;
    container.style.display = 'block';
  }

  /**
   * Generate related posts using 6-hour time-seeded random algorithm
   * @param {Object} currentProject - Current project data
   * @param {Array} allProjects - All available projects
   * @returns {Array} - Array of 5 related projects
   */
  function generateRelatedPosts(currentProject, allProjects) {
    const currentEntryId = currentProject.categorization.entry_id;

    // Filter out current project
    const otherProjects = allProjects.filter(p =>
      p.categorization.entry_id !== currentEntryId
    );

    if (otherProjects.length === 0) {
      return [];
    }

    // Get 6-hour time seed (changes every 6 hours)
    const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 6));

    // Seeded random function
    function seededRandom(seed) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    // Create seeded random scores for each project
    const scoredProjects = otherProjects.map((project, index) => {
      const seed = timeSeed + index;
      const score = seededRandom(seed);
      return { project, score };
    });

    // Sort by score (descending)
    scoredProjects.sort((a, b) => b.score - a.score);

    // Return top 5 (or fewer if less than 5 available)
    const relatedCount = Math.min(5, scoredProjects.length);
    return scoredProjects.slice(0, relatedCount).map(item => item.project);
  }

  /**
   * Populate related posts section
   */
  async function populateRelatedPosts(currentProject) {
    const container = document.getElementById('related-posts-grid');
    if (!container) return;

    // Load all projects
    const allProjects = await DataLoader.loadAllProjects();

    // Generate related posts
    const relatedPosts = generateRelatedPosts(currentProject, allProjects);

    if (relatedPosts.length === 0) {
      container.innerHTML = '<p class="text-secondary">No related posts available.</p>';
      return;
    }

    // Render tiles
    relatedPosts.forEach((project, index) => {
      const tile = TileRenderer.renderSectionTile(project);
      tile.style.animationDelay = `${index * 100}ms`;
      container.appendChild(tile);
    });
  }

  /**
   * Initialize entry page
   */
  async function init() {
    console.log('🚀 Initializing entry page...');

    try {
      // Get entry path
      const entryPath = getEntryPath();
      console.log(`📍 Entry path: ${entryPath}`);

      // Load entry data
      const project = await loadEntryData(entryPath);

      if (!project) {
        console.error('❌ Failed to load project data');
        // Show error state
        document.body.innerHTML = '<div class="container"><h1>Entry not found</h1></div>';
        return;
      }

      console.log('✅ Project loaded:', project.categorization.entry_id);

      // Populate all sections
      populateMetadata(project);
      populateBreadcrumbs(project);
      populateTagsCards(project);
      populateContent(project);
      await populateRelatedPosts(project);

      console.log('✅ Entry page initialized');

    } catch (error) {
      console.error('❌ Error initializing entry page:', error);
    }
  }

  // Public API
  return {
    init,
    loadEntryData,
    generateRelatedPosts
  };
})();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', EntryController.init);
} else {
  EntryController.init();
}
