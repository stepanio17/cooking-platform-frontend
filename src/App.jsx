import React, { useState, useEffect } from 'react';

function App() {
  const [recipes, setRecipes] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: 4,
    author_id: 1
  });

  const fetchRecipes = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/recipes');

      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Ошибка при подключении к серверу:', error);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value === 'servings' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      servings: Number(formData.servings),
      author_id: Number(formData.author_id) 
    };

    console.log('Данные для отправки:', dataToSubmit);

    try {
      const response = await fetch('http://127.0.0.1:8000/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (response.ok) {
        fetchRecipes();
        setFormData({...formData, title: '', description: ''});
      } else {
        const errorDetails = await response.json();
        console.log("Детали ошибки 422:", errorDetails);
      }
    } catch (error) {
      console.error('Ошибка при отправки рецепта:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Recipe Platfrom</h1>

      <div>
        <h2>New Recipe</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <input 
            type="text"
            name="title"
            placeholder="Название рецепта"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ padding: '10px', fontSize: '16px' }}
          />

          <textarea
            name="description"
            placeholder="Описание рецепта"
            value={formData.description}
            onChange={handleChange}
            required
            style={{ padding: '10px', fontSize: '16px', height: '100px' }}
          />

          <label>
            Порции:
            <input
              type="number"
              name="servings"
              placeholder="Количество порций"
              min="1"
              value={formData.servings}
              onChange={handleChange}
              style={{ padding: '10px', fontSize: '16px', marginLeft: '10px' }}
            />
          </label>

          <button type="submit" style={{ padding: '10px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
            Сохранить рецепт
          </button>
        </form>
      </div>

      <div>
        <h2>Рецепты</h2>
        {recipes.length === 0 ? (
          <p>Нет рецептов для отображения. Нажмите на кнопочку, пожалуйста, чтобы мы могли покушать наконец-то.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {recipes.map(recipe => (
              <li key={recipe.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                <h3>{recipe.title}. Порций: {recipe.servings}</h3>
                <p>{recipe.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;