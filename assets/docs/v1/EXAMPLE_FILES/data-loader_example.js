/**
 * DATA LOADER
 * Fetches and caches JSON project data
 * Provides helper functions for filtering and searching
 */

const DataLoader = (() => {
  // Cache for loaded data
  const cache = {
    manifest: null,
    projects: new Map()
  };

  /**
   * Normalize string for URL comparison
   * Converts "HTML/CSS/JS" -> "html-css-js"
   */
  function normalizeForURL(str) {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\//g, '-')
      .trim();
  }

  /**
   * Load and cache the manifest file
   */
  async function loadManifest() {
    if (cache.manifest) {
      return cache.manifest;
    }

    try {
      const response = await fetch('/assets/js/manifest.json');
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status}`);
      }
      cache.manifest = await response.json();
      return cache.manifest;
    } catch (error) {
      console.error('Error loading manifest:', error);
      // Return empty manifest structure if file doesn't exist yet
      return { entries: {}, sections: {} };
    }
  }

  /**
   * Load a single project by its JSON path
   */
  async function loadProject(jsonPath) {
    if (cache.projects.has(jsonPath)) {
      return cache.projects.get(jsonPath);
    }

    try {
      const fullPath = '/' + jsonPath;
      console.log(`🔍 Fetching: ${fullPath}`);
      const response = await fetch(fullPath);
      if (!response.ok) {
        console.error(`❌ Failed to fetch ${fullPath}: ${response.status}`);
        throw new Error(`Failed to load project: ${response.status}`);
      }
      const project = await response.json();
      console.log(`✅ Loaded: ${jsonPath}`);
      cache.projects.set(jsonPath, project);
      return project;
    } catch (error) {
      console.error(`❌ Error loading project from ${jsonPath}:`, error);
      return null;
    }
  }

  /**
   * Load all projects dynamically from manifest
   * Supports optional section filtering
   */
  async function loadAllProjects(section = null) {
    const projects = [];

    try {
      // Load manifest to get all project paths
      const manifest = await loadManifest();

      if (!manifest.entries || Object.keys(manifest.entries).length === 0) {
        console.warn('No entries found in manifest');
        return projects;
      }

      // Get unique JSON file paths from manifest
      const allProjectPaths = [...new Set(Object.values(manifest.entries))];

      console.log(`📂 Loading ${allProjectPaths.length} projects from manifest`);

      // Load all projects in parallel
      const loadPromises = allProjectPaths.map(path => loadProject(path));
      const results = await Promise.all(loadPromises);

      // Filter out any failed loads and apply section filter if provided
      let successCount = 0;
      results.forEach(project => {
        if (project) {
          successCount++;
          // Apply section filter if specified
          if (!section || normalizeForURL(project.categorization.placement.section) === section) {
            projects.push(project);
          }
        }
      });

      console.log(`✅ Successfully loaded ${successCount}/${allProjectPaths.length} projects`);
      console.log(`📊 After filtering: ${projects.length} projects${section ? ` (section: ${section})` : ''}`);

    } catch (error) {
      console.error('Error in loadAllProjects:', error);
    }

    return projects;
  }

  /**
   * Filter projects by section
   */
  function filterBySection(projects, section) {
    const normalized = normalizeForURL(section);
    return projects.filter(p =>
      normalizeForURL(p.categorization.placement.section) === normalized
    );
  }

  /**
   * Filter projects by subsection
   */
  function filterBySubsection(projects, section, subsection) {
    const normalizedSection = normalizeForURL(section);
    const normalizedSubsection = normalizeForURL(subsection);

    return projects.filter(p => {
      const pSection = normalizeForURL(p.categorization.placement.section);
      const pSubsection = normalizeForURL(p.categorization.placement.sub_section);
      return pSection === normalizedSection && pSubsection === normalizedSubsection;
    });
  }

  /**
   * Filter projects by tags
   * Tags can come from placement (section, sub_section) OR tagging categories
   * Note: In schema v3.1, role is a STRING (not array)
   */
  function filterByTags(projects, tags) {
    if (!tags || tags.length === 0) {
      return projects;
    }

    const normalizedTags = tags.map(t => normalizeForURL(t));

    return projects.filter(project => {
      const tagging = project.categorization.tagging;
      const placement = project.categorization.placement;

      // Build array of all tags including placement AND tagging
      const allTags = [
        // Placement tags
        placement.section,
        placement.sub_section,
        // Tagging tags (role is STRING in v3.1, others are arrays)
        ...tagging.technology,
        ...tagging.media,
        ...(tagging.role ? [tagging.role] : []), // Wrap string role in array
        ...tagging.skill
      ].map(t => normalizeForURL(t));

      // Project must have ALL selected tags
      return normalizedTags.every(tag => allTags.includes(tag));
    });
  }

  /**
   * Get all unique tags from a list of projects
   * Returns object with tags categorized
   * Note: In schema v3.1, role is a STRING (not array)
   */
  function getAllTags(projects) {
    const tagSet = new Set();

    projects.forEach(project => {
      const tagging = project.categorization.tagging;
      [
        ...tagging.technology,
        ...tagging.media,
        ...(tagging.role ? [tagging.role] : []), // Wrap string role in array
        ...tagging.skill
      ].forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   * Used for random tile ordering
   */
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Public API
  return {
    loadManifest,
    loadProject,
    loadAllProjects,
    filterBySection,
    filterBySubsection,
    filterByTags,
    getAllTags,
    shuffleArray,
    normalizeForURL
  };
})();
