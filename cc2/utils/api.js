// API utility functions for frontend
export async function getResources() {
  try {
    const response = await fetch('/api/resources');
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    const result = await response.json();
    return result.data || []; // Return the data array from our new API structure
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
      throw new Error('Failed to add resource');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding resource:', error);
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
      throw new Error('Failed to update likes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating likes:', error);
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