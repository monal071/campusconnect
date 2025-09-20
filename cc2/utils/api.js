// API utility functions for frontend
export async function getResources(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/api/resources${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    
    const result = await response.json();
    return result; // Return the full result including pagination info
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
}

export async function addResource(resourceData) {
  try {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add resource');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding resource:', error);
    throw error;
  }
}

export async function updateResource(resourceData) {
  try {
    const response = await fetch('/api/resources', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update resource');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
}

export async function deleteResource(resourceId) {
  try {
    const response = await fetch('/api/resources', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete resource');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
}

export async function updateResourceLikes(resourceId) {
  try {
    const response = await fetch('/api/resources/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update likes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating likes:', error);
    throw error;
  }
}

export async function trackResourceView(resourceId) {
  try {
    const response = await fetch('/api/resources/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to track view');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error tracking view:', error);
    throw error;
  }
}

export async function trackResourceDownload(resourceId) {
  try {
    const response = await fetch('/api/resources/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to track download');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error tracking download:', error);
    throw error;
  }
}

export async function getEvents() {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

export async function addEvent(eventData) {
  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

export async function getJobs() {
  try {
    const response = await fetch('/api/jobs');
    if (!response.ok) {
      throw new Error('Failed to fetch jobs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

export async function addJob(jobData) {
  try {
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...jobData,
        id: Date.now().toString(),
        postedAt: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add job');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding job:', error);
    throw error;
  }
}