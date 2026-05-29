import React, { useState, useEffect } from 'react';
import { 
  Box, Drawer, AppBar, Toolbar, Typography, Container, Button, Divider, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Grid, Card, 
  CardMedia, CardContent, CardActions, IconButton, TextField, CircularProgress, 
  Alert, Stack, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, 
  DialogContent 
} from '@mui/material';
import { RestaurantMenu, Favorite, AccountCircle, AddCircle, ExitToApp, MenuBook } from '@mui/icons-material';
import { Grid as GridIcon, TypeIcon } from 'lucide-react';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [formError, setFormError] = useState(null);
  const categories = ["Все", "Завтраки", "Веганское", "Дешево", "Быстро"];
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [sortBy, setSortBy] = useState("newest");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [viewMode, setViewMode] = useState('all');
  const [viewServings, setViewServings] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [excludeIngredient, setExcludeIngredient] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [activeCollection, setActiveCollection] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    servings: 4,
    category: 'Все',
    image_url: null,
    steps: [],
    ingredients: []
  });

  const changeServings = (recipeId, delta, baseServings) => {
    setViewServings(prev => {
      const current = prev[recipeId] || baseServings;
      const next = current + delta;

      if (next < 1 || next > 16) return prev;
      return { ...prev, [recipeId]: next };
    });
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/users/me', {
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля пользователя:', error);
    }
  };

  const fetchCollections = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/collections', {
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке коллекций:', error);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/collections', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ name: newCollectionName })
      });
      if (response.ok) {
        setNewCollectionName('');
        fetchCollections();
      }
    } catch (error) {
      console.error('Ошибка при создании коллекции:', error);
    }
  };

  const handleAddToCollection = async (collectionId) => {
    if (!selectedRecipe) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/collections/${collectionId}/recipes/${selectedRecipe.id}`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        alert('Рецепт добавлен в коллекцию!');
      } else {
        const error = await response.json();
        alert(error.detail || 'Ошибка при добавлении рецепта в коллекцию.');
      }
    } catch (error) {
      console.error('Ошибка при добавлении в коллекцию:', error);
    }
  };

  const fetchCollectionRecipes = async (collectionId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/collections/${collectionId}`, {
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        setActiveCollection(data.name);
        setViewMode('custom-collection');
      }
    } catch (error) {
      console.error('Ошибка при загрузке рецептов коллекции:', error);
    }
  };

  const fetchRecipes = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes?search=${searchTerm.trim()}&category=${selectedCategory}&sort_by=${sortBy}&ingredient_search=${ingredientSearch.trim()}&exclude_ingredient=${excludeIngredient.trim()}`);

      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      } else {
        setServerError("Ошибка при подключении к серверу. Пожалуйста, попробуйте позже.");
      }
    } catch (error) {
      console.error('Ошибка при подключении к серверу:', error);
      setServerError("Ошибка при подключении к серверу. Пожалуйста, попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async (requestedMode) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/favorites', {
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (response.ok) {
        const data = await response.json();
        
        setFavoriteIds(data.map(recipe => recipe.id));

        const activeMode = requestedMode || viewMode;

        if (activeMode === 'favorites') {
          setRecipes(data);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке избранных рецептов:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'all') {
      fetchRecipes();
      if (token) {
        fetchFavorites('all');
      }
    } else if (viewMode === 'favorites') {
      fetchFavorites('favorites');
    }
  }, [searchTerm, selectedCategory, sortBy, viewMode, token, ingredientSearch, excludeIngredient]);

  useEffect(() => {
    if (selectedRecipe) {
      fetch(`http://127.0.0.1:8000/recipes/${selectedRecipe.id}/view`, {
        method: 'POST'
      }).then(() => {
        fetchRecipes();
      });
    }
  }, [selectedRecipe]);

  const handleRegister = async () => {
    const username = prompt("Введите имя пользователя для регистрации:");
    const password = prompt("Введите пароль для регистрации:");
    const email = prompt("Введите email для регистрации:");

    if (!username || !password || !email) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: username, 
          password: password, 
          email: email 
        })
      });

      if (response.ok) {
        alert('Регистрация прошла успешно!');
      } else {
        const errorDetails = await response.json();
        alert(errorDetails.detail || "Произошла ошибка при регистрации.");
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    alert('Вы вышли из системы.');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormError(null);

    let finalValue = value;

    if (name === 'servings') {
      finalValue = value.replace(/^0+(?=\d)/, '');
    
      if (finalValue !== '' && parseInt(finalValue) > 16) {
        setFormError("Максимальное количество порций - 16. Уменьшите количество порций.");
      }
    } 
    setFormData({
      ...formData,
      [name]: finalValue
    });
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index][field] = value;
    setFormData({...formData, ingredients: updatedIngredients});
  }

  const addIngredientRow = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', amount: '', unit: 'г' }]
    });
  };

  const removeIngredientRow = (index) => {
    const updatedIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({...formData, ingredients: updatedIngredients});
  }

  const handleLogin = async () => {
    const username = prompt("Введите имя пользователя:");
    const password = prompt("Введите пароль:");

    if (!username || !password) return;

    const loginData = new URLSearchParams();
    loginData.append('username', username);
    loginData.append('password', password);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'},
        body: loginData.toString()
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        alert('Успешный вход!');
      } else {
        alert("Неверное имя пользователя или пароль");
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
    }
  };

  const uploadImageFile = async (file) => {
    if (!file) return null;

    const fileData = new FormData();
    fileData.append("file", file);

    try {
      const response = await fetch('http://127.0.0.1:8000/upload-image', {
        method: 'POST',
        body: fileData
      });

      if (response.ok) {
        const data = await response.json();
        return data.image_url;
      }
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (Number(formData.servings) > 16) {
      setFormError("Нельзя сохранить рецепт, количество порций превышает 16.");
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Пожалуйста, войдите в систему, чтобы добавить рецепт.');
      return;
    }

    const url = editingRecipeId ? `http://127.0.0.1:8000/recipes/${editingRecipeId}` : 'http://127.0.0.1:8000/recipes';
    const method = editingRecipeId ? 'PUT' : 'POST';

    const dataToSubmit = {
      title: formData.title,
      description: formData.description,
      servings: Number(formData.servings), 
      category: formData.category,
      image_url: formData.image_url,
      steps: (formData.steps || []).map((step, index) => ({
        ...step,
        step_number: index + 1
      })),
      ingredients: formData.ingredients.map(ing => ({
        name: ing.name,
        amount: Number(ing.amount),
        unit: ing.unit
      }))
    };

    setIsSaving(true);

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (response.ok) {
        const savedRecipe = await response.json();
        if (formData.image) {
          const imageData = new FormData();
          imageData.append("file", formData.image);
          
          await fetch(`http://127.0.0.1:8000/recipes/${savedRecipe.id}/image`, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`},
            body: imageData
          });
        }

        fetchRecipes();
        setEditingRecipeId(null);
        setFormData({
          title: '', 
          description: '', 
          servings: 4, 
          category: 'Завтраки', 
          image: null,
          ingredients: []
        });
        alert(`Рецепт успешно ${editingRecipeId ? 'обновлен' : 'создан'}!`);
      } else {
        const errorDetails = await response.json();
        
        if (response.status === 401) {
          setFormError("Ceccия истекла. Пожалуйста, войдите снова.");
        } else if (response.status === 422) {
          const messages = errorDetails.detail.flat().map(err => `${err.loc[1]}: ${err.msg}`).join('\n'); 
          setFormError(`Ошибка данных:\n${messages}`);
        } else {
          setFormError(typeof errorDetails.detail === 'string' ? errorDetails.detail : "Произошла ошибка при сохранении рецепта.");
        }
      }
    } catch (error) {
      console.error('Ошибка при отправки рецепта:', error);
      setFormError("Ошибка соединения с сервером. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRate = async (isPositive) => {
    if (!token) {
      alert('Пожалуйста, войдите в систему, чтобы оценить рецепт.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes/${selectedRecipe.id}/rate?is_positive=${isPositive}`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (response.ok) {
        fetchRecipes();
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Ошибка при оценке рецепта:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот рецепт?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) fetchRecipes();
    } catch (error) {
      console.error('Ошибка при удалении рецепта:', error);
    }
  };

  const startEditing = (recipe) => {
    setEditingRecipeId(recipe.id);
    setFormData({
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      category: recipe.category || 'Завтраки',
      image: null,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit
      }))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = async (recipeId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/recipes/${recipeId}/favorite`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (response.ok) {
        fetchFavorites(viewMode);
      }
    } catch (error) {
      console.error('Ошибка при добавлении в избранные рецепты:', error);
    }
  };

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Верхняя панель приложения */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#2196f3' }}>
        <Toolbar>
          <RestaurantMenu sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontFamily: 'Arial, sans-serif' }}>
            Кулинарная платформа Аппетит.Про
          </Typography>
          
          {!token ? (
            <Box>
              <Button color="inherit" onClick={handleRegister}>Регистрация</Button>
              <Button color="inherit" variant="outlined" onClick={handleLogin} sx={{ ml: 1, borderColor: '#fff', '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)'}}}>Войти</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button 
                color="inherit" 
                startIcon={<AccountCircle />} 
                onClick={() => { fetchUserProfile(); fetchCollections(); setShowProfile(true); }}
                sx={{ textTransform: 'none', fontSize: '1rem' }}
              >
                Личный кабинет
              </Button>
              <Button 
                color="inherit" 
                startIcon={<ExitToApp />} 
                onClick={handleLogout}
                sx={{ textTransform: 'none', fontSize: '1rem' }}
              >
                Выйти
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Боковая панель навигации */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#f5f5f5' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 1  }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton selected={viewMode === 'all'} onClick={() => { setViewMode('all'); setActiveCollection(null); fetchRecipes(); }}>
                <ListItemIcon><MenuBook /></ListItemIcon>
                <ListItemText primary="Все рецепты" />
              </ListItemButton>
            </ListItem>

            {token && (
              <ListItem disablePadding>
                <ListItemButton selected={viewMode === 'create'} onClick={() => setViewMode('create')}>
                  <ListItemIcon><AddCircle color="primary" /></ListItemIcon>
                  <ListItemText primary="Добавить рецепт" />
                </ListItemButton>
              </ListItem>
            )}

            {token && (
              <ListItem disablePadding>
                <ListItemButton selected={viewMode === 'favorites'} onClick={() => setViewMode('favorites')}>
                  <ListItemIcon><Favorite color="primary" /></ListItemIcon>
                  <ListItemText primary="Избранные рецепты" />
                </ListItemButton>
              </ListItem>
            )}
            </List>

            {token && <Divider sx={{ my: 2 }} />}

            {token && (
              <Box>
                <Typography variant="caption" sx={{ pl: 1, color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>
                  Мои коллекции
                </Typography>
                <List>
                  {collections.length === 0 ? (
                    <Typography variant="body2" sx={{ pl: 1, color: '#888', fontStyle: 'italic', mt: 1 }}>Нет коллекций</Typography>
                  ) : (
                    collections.map(col => (
                      <ListItem disablePadding key={col.id}>
                        <ListItemButton selected={activeCollection === col.name} onClick={() => fetchCollectionRecipes(col.id)}>
                          <ListItemText primary={`${col.name}`} sx={{ '& .MuiTypography-root': { fontSize: '14px' }}}/>
                        </ListItemButton>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            )}
        </Box>
      </Drawer>

      {/* Основной контент */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Toolbar />
        <Container maxWidth="lg">
          
          {serverError && (
            <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>
          )}
        
        {/* Просмотр рецептов */}
        {(viewMode === 'all' || viewMode === 'favorites' || viewMode === 'custom-collection') && (
          <Box>
            <Typography variant="h4"  sx={{ mb: 3, fontWeight: 'bold', fontFamily: 'Arial' }}>
              {activeCollection ? `Коллекция: ${activeCollection}` : (viewMode === 'favorites' ? 'Избранные рецепты' : 'Все рецепты')}
            </Typography>

            <Box sx={{ backgroundColor: '#fff', p: 3, borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium'}}>Поиск и фильтрация</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Что хочешь поесть?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="outlined" size="small" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Что есть в холодильнике?" value={ingredientSearch} onChange={(e) => setIngredientSearch(e.target.value)} variant="outlined" size="small" />
                </Grid>    
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Что исключить?" value={excludeIngredient} onChange={(e) => setExcludeIngredient(e.target.value)} variant="outlined" size="small" />
                </Grid>   
              </Grid>

              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <Button key={cat} variant={selectedCategory === cat ? 'contained' : 'outlined'} onClick={() => setSelectedCategory(cat)} size="small" sx={{ textTransform: 'none', borderRadius: '20px' }}>
                    {cat}
                  </Button>
                ))}
              </Box>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2, mt: 0.5 }}>Загрузка рецептов...</Typography>
              </Box>
            ) : recipes.length === 0 ? (
              <Typography variant="body1" sx={{ mt: 4, color: '#666', textAlign: 'center' }}>Рецепты не найдены</Typography>
            ) : (
              <Grid container spacing={3}>
                {recipes.map(recipe => (
                  <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, position: 'relative', transition: '0.3s', '&:hover': { boxShadow: '5' } }}>

                      {token && (
                        <IconButton 
                          onClick={() => toggleFavorite(recipe.id)}
                          sx={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', zIndex: 10 }}
                        >
                          {favoriteIds.includes(recipe.id) ? <Favorite color="error" /> : <Favorite sx={{ color: '#ccc' }} />}
                        </IconButton>
                      )}

                      {recipe.image_url && (
                        <CardMedia
                          component="img"
                          height="180"
                          image={recipe.image_url}
                          alt={recipe.title}
                          onClick={() => setSelectedRecipe(recipe)}
                          sx={{ cursor: 'pointer', objectFit: 'cover' }}    
                        />
                      )}

                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                          {recipe.category || 'Без категории'}
                        </Typography>
                        <Typography variant="h6" onClick={() => setSelectedRecipe(recipe)} sx={{ cursor: 'pointer', lineHeight: '1.3', fontWeight: 'bold', '&:hover': { color: '#2196f3' } }}>
                          {recipe.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {recipe.description}
                        </Typography>
                      </CardContent>

                      <Box sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#fafafa', py: 1 }}>
                        <Button size="small" variant="outlined" sx={{ minWidth: '25px', p: '2px' }} onClick={() => changeServings(recipe.id, -1, recipe.servings)} >-</Button>
                        <Typography variant="body2" sx={{ minWidth: '60px', textAlign: 'center' }}>
                          {viewServings[recipe.id] || recipe.servings} порций
                        </Typography>
                        <Button size="small" variant="outlined" sx={{ minWidth: '25px', p: '2px' }} onClick={() => changeServings(recipe.id, 1, recipe.servings)} >+</Button>
                      </Box>

                      {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <Box sx={{ px: 2, pt: 1, pb: 2, backgroundColor: '#fafafa', borderTop: '1px solid #eee' }}>
                          <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '13px', color: '#555' }}>
                            {recipe.ingredients.slice(0, 3).map(ing => {
                              const currentServings = viewServings[recipe.id] || recipe.servings;
                              const multiplier = currentServings / recipe.servings;
                              const calcAmount = (ing.amount * multiplier).toFixed(1).replace(/\.0$/, '');
                              return (
                                <li key={ing.id}>{ing.name} - <strong>{calcAmount} {ing.unit}</strong></li>
                              );
                            })}
                            {recipe.ingredients.length > 3 && <li style={{ color: '#2196f3', listStyleType: 'none', marginTop: '2px' }}>и ещё {recipe.ingredients.length - 3}...</li>}
                          </ul>
                        </Box>
                      )}
                      
                      {token && (
                        <CardActions sx={{ borderTop: '1px solid #eee', justifyContent: 'flex-end', gap: 1, p: 1.5 }}>
                          <Button size="small" variant="contained" color="primary" onClick={() => startEditing(recipe)}>Редактировать</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(recipe.id)}>Удалить</Button>
                        </CardActions>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Форма добавления/редактирования рецепта */}
        {viewMode === 'create' && (
          <Box sx={{ backgroundColor: '#fff', p: 4, borderRadius: 3, boxShadow: 1 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Добавление нового рецепта</Typography>

              {/* Форма для создания или редактирования рецепта nado dopisat*/}            
            
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}

              <Stack spacing={3}>
                {/* Название и описание */}
                <TextField fullWidth label="Название рецепта" name="title" value={formData.title} onChange={handleChange} required />
                <TextField fullWidth multiline rows={4} label="Описание рецепта" name="description" value={formData.description} onChange={handleChange} required />
                
                {/* Порции и Категория */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth type="number" label="Количество порций" name="servings" inputProps={{ min: 1, max: 16 }} value={formData.servings} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="category-select-label">Категория</InputLabel>
                      <Select labelId="category-select-label" name="category" label="Категория" value={formData.category} onChange={handleChange}>
                        {categories.filter(c => c !== "Все").map(cat => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Динамические Ингредиенты */}
                <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Ингредиенты</Typography>
                  {formData.ingredients.map((ing, index) => (
                    <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
                      <Grid item xs={5}>
                        <TextField fullWidth size="small" placeholder="Название ингредиента" value={ing.name} onChange={(e) => handleIngredientChange(index, 'name', e.target.value)} />
                      </Grid>
                      <Grid item xs={2}>
                        <TextField fullWidth size="small" type="number" placeholder="Кол-во" value={ing.amount} onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)} />
                      </Grid>
                      <Grid item xs={3}>
                        <Select fullWidth size="small" value={ing.unit} onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}>
                          {["г", "кг", "мл", "л", "шт", "ст.л.", "ч.л.", "по вкусу"].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </Select>
                      </Grid>
                      <Grid item xs={2}>
                        <Button fullWidth color="error" variant="outlined" onClick={() => removeIngredientRow(index)}>Удалить</Button>
                      </Grid>
                    </Grid>
                  ))}
                  <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={addIngredientRow}>Добавить ингредиент</Button>
                </Box>

                {/* Загрузка главного фото блюда */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Главная фотография блюда:</Typography>
                  <Button variant="outlined" component="label">
                    Выбрать файл
                    <input type="file" accept="image/*" hidden onChange={async (e) => {
                      const file = e.target.files[0];
                      const url = await uploadImageFile(file);
                      if (url) setFormData({ ...formData, image_url: url });
                    }} />
                  </Button>
                  {formData.image_url && (
                    <Box sx={{ mt: 2 }}><img src={formData.image_url} alt="Preview" style={{ height: '120px', borderRadius: '8px', objectFit: 'cover' }} /></Box>
                  )}
                </Box>

                {/* Пошаговые инструкции */}
                <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Пошаговый процесс приготовления</Typography>
                  {(formData.steps || []).map((step, index) => (
                    <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #ddd' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Шаг {index + 1}</Typography>
                      <TextField fullWidth multiline rows={2} placeholder="Опишите, что нужно сделать на этом шаге..." value={step.instruction} onChange={(e) => {
                        const newSteps = [...formData.steps];
                        newSteps[index].instruction = e.target.value;
                        setFormData({ ...formData, steps: newSteps });
                      }} required sx={{ mb: 1 }} />
                      
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button variant="outlined" size="small" component="label">
                          Фото шага
                          <input type="file" accept="image/*" hidden onChange={async (e) => {
                            const file = e.target.files[0];
                            const url = await uploadImageFile(file);
                            if (url) {
                              const newSteps = [...formData.steps];
                              newSteps[index].image_url = url;
                              setFormData({ ...formData, steps: newSteps });
                            }
                          }} />
                        </Button>
                        {step.image_url && <img src={step.image_url} alt="Шаг" style={{ height: '40px', borderRadius: 4 }} />}
                        <Button color="error" size="small" sx={{ ml: 'auto' }} onClick={() => {
                          const newSteps = formData.steps.filter((_, i) => i !== index);
                          setFormData({ ...formData, steps: newSteps });
                        }}>Удалить шаг</Button>
                      </Box>
                    </Box>
                  ))}
                  <Button variant="contained" color="success" size="small" onClick={() => {
                    setFormData({ ...formData, steps: [...(formData.steps || []), { instruction: '', image_url: null }] });
                  }}>Добавить шаг</Button>
                </Box>

                {/* Сабмит формы */}
                <Button type="submit" variant="contained" color="primary" size="large" disabled={isSaving}>
                  {isSaving ? 'Сохранение...' : (editingRecipeId ? 'Обновить рецепт' : 'Сохранить рецепт')}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}

        </Container>
      </Box>

      <Dialog open={Boolean(selectedRecipe)} onClose={() => setSelectedRecipe(null)} maxWidth="md" fullWidth>
        {selectedRecipe && (
          <>
            <DialogTitle sx={{ fontWeight: 'bold', pr: 6, fontFamily: 'Arial' }}>
              {selectedRecipe.title}
              <IconButton onClick={() => setSelectedRecipe(null)} sx={{ position: 'absolute', top: 8, right: 8, color: '#aaa', fontSize: '24px' }}>×</IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {selectedRecipe.image_url && (
                <img src={selectedRecipe.image_url} alt={selectedRecipe.title} style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
              )}
              
              {/* Панель со счетчиком просмотров и лайками */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">{selectedRecipe.views} просмотров</Typography>
                <Button size="small" variant="contained" color="success" sx={{ borderRadius: '15px' }} onClick={() => handleRate(true)}>👍 Рекомендую ({selectedRecipe.likes_count || 0})</Button>
                <Button size="small" variant="contained" color="error" sx={{ borderRadius: '15px' }} onClick={() => handleRate(false)}>👎 Не рекомендую ({selectedRecipe.dislikes_count || 0})</Button>
                
                {/* Быстрое добавление в папку */}
                {token && (
                  <FormControl size="small" sx={{ ml: 'auto', minWidth: 170 }}>
                    <InputLabel>Сохранить в коллекцию</InputLabel>
                    <Select label="Сохранить в коллекцию" value="" onChange={(e) => { if (e.target.value) handleAddToCollection(e.target.value); }}>
                      {collections.map(col => <MenuItem key={col.id} value={col.id}>📁 {col.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </Box>

              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3, fontSize: '1.05rem', lineHeight: 1.6 }}>{selectedRecipe.description}</Typography>
              
              {/* Ингредиенты внутри модалки */}
              <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, fontSize: '16px' }}>Ингредиенты блюда:</Typography>
                <ul style={{ lineHeight: 1.6, margin: 0, paddingLeft: '20px' }}>
                  {(selectedRecipe.ingredients || []).map(ing => (
                    <li key={ing.id}>{ing.name} — <strong>{ing.amount} {ing.unit}</strong></li>
                  ))}
                </ul>
              </Box>

              {/* Пошаговый процесс внутри модалки */}
              {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, fontSize: '16px' }}>Пошаговый процесс приготовления:</Typography>
                  {selectedRecipe.steps.map((step, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, borderLeft: '4px solid #2196f3', backgroundColor: '#fafafa', borderRadius: '0 8px 8px 0' }}>
                      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>Шаг {step.step_number || index + 1}</Typography>
                      <Typography variant="body1" sx={{ my: 1, whiteSpace: 'pre-wrap', fontSize: '14px' }}>{step.instruction}</Typography>
                      {step.image_url && <img src={step.image_url} alt="Шаг фото" style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: 4, objectFit: 'cover', marginTop: '5px' }} />}
                    </Box>
                  ))}
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      <Dialog open={showProfile} onClose={() => setShowProfile(false)} maxWidth="xs" fullWidth>
        {userData && (
          <>
            <DialogTitle sx={{ fontWeight: 'bold', fontFamily: 'Arial' }}>
              Личный кабинет
              <IconButton onClick={() => setShowProfile(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#aaa', fontSize: '24px' }}>×</IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body1">Пользователь: <strong>{userData.username}</strong></Typography>
                
                {/* Редактирование данных юзера */}
                <TextField fullWidth size="small" label="Ваше имя" value={userData.name || ''} onChange={(e) => setUserData({...userData, name: e.target.value})} />
                <TextField fullWidth size="small" label="Ваша фамилия" value={userData.surname || ''} onChange={(e) => setUserData({...userData, surname: e.target.value})} />
                <TextField fullWidth size="small" type="email" label="Email" value={userData.email || ''} onChange={(e) => setUserData({...userData, email: e.target.value})} />
                
                <Button variant="contained" color="success" onClick={async () => {
                  const response = await fetch('http://127.0.0.1:8000/users/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(userData)
                  });
                  if (response.ok) alert('Профиль обновлен успешно!');
                }}>Сохранить изменения профиля</Button>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Управление папками-коллекциями */}
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '15px' }}>Создать новую коллекцию</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" fullWidth placeholder="Название новой папки" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} />
                  <Button variant="contained" onClick={handleCreateCollection}>Создать</Button>
                </Box>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default App;